const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/login.html"));
});

app.get("/login.js", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/login.js"));
});

app.get("/room/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/game.html"));
});

let click = 0;

// Socket.IO connection logic
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });

    socket.on("click", () => {
        click++;
        io.emit("click", click);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
