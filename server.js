const config = require('config');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const app = express();
const moment = require('moment');
const server = http.createServer(app);
const io = socketio(server);
const { connect, findOne, insertOne, pushMessage } = require('./db');
const PUBLIC_ROOM = '6055d25366b643b1e4711d5c';
const botName = 'Chat Bot ';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

connect().then((client) => {
  io.on('connection', (socket) => {
    socket.on('joinToPublicRoom', async ({ userId }) => {
      const dbUser = await findOne(client, 'Users', userId);
      const publicRoom = await findOne(client, 'Rooms', '6055d25366b643b1e4711d5c');

      const user = userJoin(socket.id, dbUser.userName, dbUser, 'publicRoom');
      socket.join(user.room);
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to Chat!'));
      socket.emit(
        'chatHisory',
        publicRoom.messages.map((message) =>
          formatMessage(message.creator.userName, message.content, message.date)
        )
      );
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

      // Runs when client disconnects
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
    });
  });
});

const PORT = process.env.PORT || config.get('port');
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//USER 6055d1a966b643b1e4711d50
// app.use(express.static(path.join(__dirname, 'public'))); for test
