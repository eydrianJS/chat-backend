const moment = require('moment');
const socketio = require('socket.io');
const { server } = require('./app');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('../utils/users');
const { connect, findOne, insertOne, pushMessage } = require('../db');
const formatMessage = require('../utils/messages');
const io = socketio(server);
const PUBLIC_ROOM = '60831de6ffc279002e1e35dd';
const botName = 'Chat Bot ';

const zakazaneSlowa = ['kurwa', 'chuj', 'czarny', 'gwałt'];

connect().then((client) => {
  io.on('connection', (socket) => {
    socket.on('joinToPublicRoom', async ({ userId }) => {
      // console.log('🚀 ~ file: socket.js ~ line 16 ~ socket.on ~ userId', userId);
      console.log('🚀 ~ file: socket.js ~ line 33 ~ socket.on ~ userId', userId);
      const dbUser = await findOne(client, 'Users', userId);
      console.log('🚀 ~ file: socket.js ~ line 19 ~ socket.on ~ dbUser', dbUser);
      const publicRoom = await findOne(client, 'Rooms', PUBLIC_ROOM);
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

    socket.on('joinToPrivateRoom', async ({ userId, roomId }) => {
      const dbUser = await findOne(client, 'Users', userId);
      const privateRoom = await findOne(client, 'Rooms', roomId);
      if (!dbUser || !privateRoom) {
        return socket.emit('private_message', 'Unauth');
      }
      const hasAccess = privateRoom?.usersWithCredentials.filter((user) => {
        return user._id == userId;
      });

      if (!hasAccess?.length) {
        return socket.emit('private_message', 'Unauth');
      }
      const user = userJoin(socket.id, dbUser.userName, dbUser, roomId);

      socket.join(user.room);
      // Welcome current user
      socket.emit('private_message', formatMessage(botName, 'Welcome to Chat!'));
      //load chat history
      loadAllMessage(socket, privateRoom);
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit('private_message', formatMessage(botName, `${user.username} has joined the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: privateRoom.name,
        users: getRoomUsers(user.room),
      });

      //   // Listen for chatMessage
      saveAndSendMessage(socket, client);

      //   // Runs when client disconnects
      disconect(socket);
    });

    socket.on('getRooms', async () => {
      try {
        const client = await connect();
        let total = await findAll(client, 'Rooms');
        socket.emit('rooms', total);
      } catch (e) {
        socket.emit('rooms', e);
      }
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
    const slowa = zakazaneSlowa.filter((item) => {
      return msg.indexOf(item) > -1;
    });

    if (!!slowa.length) {
      return socket.emit('message', formatMessage(botName, 'Prosze nie używać takich słów'));
    }

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
