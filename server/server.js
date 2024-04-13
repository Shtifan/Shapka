const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Define a map to store rooms
const rooms = new Map();

// Socket.IO connection logic
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle room creation
    socket.on("createRoom", (roomId, playerName) => {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(playerName);
        socket.join(roomId);
        io.to(roomId).emit("roomCreated", roomId);
    });

    // Handle room joining
    socket.on("joinRoom", (roomId, playerName) => {
        if (rooms.has(roomId)) {
            rooms.get(roomId).add(playerName);
            socket.join(roomId);
            io.to(roomId).emit("playerJoined", playerName);
        } else {
            socket.emit("roomNotExist");
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
