const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let drawingData = []; // Array to store drawing data

io.on('connection', (socket) => {
    console.log('a user connected');

    // Send the current drawing data to the new user
    socket.emit('init', drawingData);

    socket.on('draw', (data) => {
        drawingData.push(data); // Store the drawing data (push the new path)
        socket.broadcast.emit('draw', data); // Broadcast to other users
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
