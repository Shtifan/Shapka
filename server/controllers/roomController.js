// Room controller

const { log } = require("../utils/helpers");
const { initializeRoom, addPlayerToRoom, removePlayerFromRoom } = require("../models/Room");
const { emitGameState } = require("./gameStateController");

// Join a room
function joinRoom(io, rooms, playerSessions, socket, data) {
    const { roomName, playerName } = data;
    if (!roomName || !playerName) {
        socket.emit("error", "Room name and player name are required");
        return;
    }

    // Check if room exists, create if it doesn't
    if (!rooms.has(roomName)) {
        rooms.set(roomName, initializeRoom(roomName));
        log("info", roomName, "New room created");
    }

    const room = rooms.get(roomName);

    // Check if player name is already taken
    if (room.players.some((p) => p.name === playerName)) {
        socket.emit("error", "Player name already taken");
        return;
    }

    // Add player to room
    const player = addPlayerToRoom(room, socket.id, playerName);
    socket.join(roomName);
    playerSessions.set(socket.id, { roomName, playerName });

    // Emit updated game state
    emitGameState(io, rooms, roomName);

    log("info", roomName, `Player ${playerName} joined the room`);
}

// Leave a room
function leaveRoom(io, rooms, playerSessions, socket, roomName) {
    const room = rooms.get(roomName);
    if (!room) return;

    const session = playerSessions.get(socket.id);
    if (!session) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    removePlayerFromRoom(room, socket.id);
    socket.leave(roomName);
    playerSessions.delete(socket.id);

    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(roomName);
        log("info", roomName, "Room deleted - no players left");
    } else {
        // Emit updated game state
        emitGameState(io, rooms, roomName);
        log("info", roomName, `Player ${player.name} left the room`);
    }
}

// Handle disconnect
function handleDisconnect(io, rooms, playerSessions, socket, reason) {
    const session = playerSessions.get(socket.id);
    if (!session) return;

    const { roomName, playerName } = session;
    const room = rooms.get(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Mark player as disconnected
    player.isConnected = false;

    // If game is not in progress, remove player
    if (room.gameState === "waiting") {
        removePlayerFromRoom(room, socket.id);
        playerSessions.delete(socket.id);

        // If room is empty, delete it
        if (room.players.length === 0) {
            rooms.delete(roomName);
            log("info", roomName, "Room deleted - no players left");
        }
    }

    // Emit updated game state
    emitGameState(io, rooms, roomName);
    log("info", roomName, `Player ${playerName} disconnected: ${reason}`);
}

module.exports = {
    joinRoom,
    leaveRoom,
    handleDisconnect,
};
