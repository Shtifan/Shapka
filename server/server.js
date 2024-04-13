const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

let click = 0;

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../client/login.html"));
});

app.get("/room/:id", (req, res) => {
    let id = req.params.id;

    res.sendFile(join(__dirname, "../client/index.html"));
});

app.get("/login.js", (req, res) => {
    res.sendFile(join(__dirname, "../client/login.js"));
});

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

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
});
