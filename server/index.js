const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { initializeSocketRoutes } = require("./routes/socketRoutes");
const { log } = require("./utils/helpers");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Serve static files
app.use(express.static(path.join(__dirname, "../client/build")));

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Game state
const rooms = new Map();
const playerSessions = new Map();

// Initialize socket routes
initializeSocketRoutes(io, rooms, playerSessions);

// Serve React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    log("info", null, `Server running on port ${PORT}`);
});
