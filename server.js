const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const {
    userJoin,
    getCurrentUser,
    getRoomUsers,
    userLeave

} = require('./utils/users')
//server or app 
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = 'chatCord Bot';

//set static folder 
app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({
        username,
        room
    }) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'welcome to Real Chat'));
        //Broadcast to all expt the user
        socket.broadcast.to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has Joined say Hi !`));

        //send users and info 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    //listen to msg
    socket.on('chatMessage', msg => {

        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    //Run when disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });

});
//PORT
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`serer running on port ${PORT}`));