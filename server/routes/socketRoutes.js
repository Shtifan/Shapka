// Socket routes

const { joinRoom, leaveRoom, handleDisconnect, handleDisconnectOrLeave } = require("../controllers/roomController");
const { startGame, handleWordSubmission } = require("../controllers/gameStateController");
const { startTurn, handleGuess, endGame } = require("../controllers/gameplayController");
const { assignTeams, switchTeams } = require("../controllers/teamController");

// Initialize socket routes
function initializeSocketRoutes(io, rooms, playerSessions) {
    io.on("connection", (socket) => {
        // Join room
        socket.on("joinRoom", (data) => {
            joinRoom(io, rooms, playerSessions, socket, data);
        });

        // Leave room
        socket.on("leaveRoom", (roomName) => {
            leaveRoom(io, rooms, playerSessions, socket, roomName);
        });

        // Start game
        socket.on("startGame", (data) => {
            startGame(io, rooms, data.roomName, socket);
        });

        // Submit words
        socket.on("submitWords", (data) => {
            handleWordSubmission(io, rooms, data.roomName, socket, data.words);
        });

        // Start turn
        socket.on("startTurn", (data) => {
            startTurn(io, rooms, data.roomName);
        });

        // Handle guess
        socket.on("guess", (data) => {
            handleGuess(io, rooms, socket, data);
        });

        // Switch teams
        socket.on("switchTeam", (data) => {
            switchTeams(io, rooms, socket, data);
        });

        // Handle disconnect
        socket.on("disconnect", (reason) => {
            handleDisconnect(io, rooms, playerSessions, socket, reason);
        });
    });
}

module.exports = {
    initializeSocketRoutes,
};
