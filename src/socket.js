const moment = require('moment');
const socketio = require('socket.io');
const { server } = require('./app');

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('../utils/users');
const { connect, findOne, insertOne, pushMessage } = require('../db');
const formatMessage = require('../utils/messages');

const io = socketio(server);
const PUBLIC_ROOM = '6055d25366b643b1e4711d5c';
const botName = 'Chat Bot ';

connect().then((client) => {
  io.on('connection', (socket) => {
    socket.on('joinToPublicRoom', async ({ userId }) => {
      const dbUser = await findOne(client, 'Users', userId);
      const publicRoom = await findOne(client, 'Rooms', '6055d25366b643b1e4711d5c');
      const user = userJoin(socket.id, dbUser.userName, dbUser, 'publicRoom');

      socket.join(user.room);
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to Chat!'));
      //load chat history
      loadAllMessage(socket, publicRoom);
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: 'Public room',
        users: getRoomUsers(user.room),
      });

      // Listen for chatMessage
      saveAndSendMessage(socket, client);

      // Runs when client disconnects
      disconect(socket);
    });
  });
});

const loadAllMessage = (socket, publicRoom) => {
  socket.emit(
    'chatHisory',
    publicRoom.messages.map((message) =>
      formatMessage(message.creator.userName, message.content, message.date)
    )
  );
};

const saveAndSendMessage = (socket, client) => {
  socket.on('chatMessage', async (msg) => {
    const user = getCurrentUser(socket.id);
    const date = moment().toISOString();
    const json = {
      creator: user.dbUser,
      content: msg,
      date: date,
    };
    const messageId = await insertOne(client, 'Messages', json);
    const message = { _id: messageId, ...json };
    await pushMessage(client, 'Rooms', PUBLIC_ROOM, message);
    io.to(user.room).emit('message', formatMessage(user.username, msg, date));
  });
};

const disconect = (socket) => {
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
};
