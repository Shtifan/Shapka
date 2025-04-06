// Helper functions for the game server

// Generate a random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Centralized logging
function log(level, roomName, message, data = null) {
    const roomTag = roomName ? `[${roomName}]` : `[Global]`;
    const logMessage = `${roomTag} ${message}`;
    if (level === "error") {
        console.error(logMessage, data || "");
    } else if (level === "warn") {
        console.warn(logMessage, data || "");
    } else {
        console.log(logMessage, data || "");
    }
}

// Safely get room, emit error if not found
function getSafeRoom(rooms, roomName, socket, operation = "Operation") {
    const room = rooms.get(roomName);
    if (!room) {
        log("error", roomName, `${operation} failed: Room not found for socket ${socket?.id}`);
        if (socket) {
            socket.emit("error", `Room '${roomName}' does not exist.`);
            socket.emit("redirectToHome"); // Suggest redirect
        }
        return null;
    }
    return room;
}

// Safely get player, emit error if not found
function getSafePlayer(room, socketId, socket, operation = "Operation") {
    if (!room) return null; // Room already checked or not relevant
    const player = room.players.find((p) => p.id === socketId);
    if (!player) {
        log("error", room?.name, `${operation} failed: Player with socket ${socketId} not found.`);
        if (socket) {
            socket.emit("error", "Player not found in this room.");
        }
        return null;
    }
    return player;
}

// Get winner based on team scores
function getWinner(teamScores) {
    let winner = null;
    let highestScore = -1;
    let tie = false;

    Object.entries(teamScores).forEach(([teamName, scoreData]) => {
        if (scoreData.total > highestScore) {
            highestScore = scoreData.total;
            winner = teamName;
            tie = false;
        } else if (scoreData.total === highestScore && highestScore >= 0) {
            // Check score is non-negative
            tie = true;
            winner = "Tie";
        }
    });

    // If only one team has points (or exists), they win regardless
    const teamsWithScores = Object.entries(teamScores).filter(([_, data]) => data.total >= 0);
    if (teamsWithScores.length === 1 && !tie) {
        winner = teamsWithScores[0][0];
    } else if (teamsWithScores.length === 0) {
        winner = "No winner"; // Or handle as needed
    }

    return winner;
}

module.exports = {
    generateSessionId,
    log,
    getSafeRoom,
    getSafePlayer,
    getWinner,
};
