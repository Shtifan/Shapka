const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (e.g., your game client)
app.use(express.static(__dirname + "/public"));

// Socket.IO connection logic
io.on("connection", (socket) => {
    console.log("A user connected");

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
