// Game state controller

const { log } = require("../utils/helpers");
const { REQUIRED_WORDS_PER_PLAYER, TURN_DURATION_MS } = require("../models/Room");

// Send full game state update to a specific socket or whole room
function emitGameState(io, rooms, roomName, targetSocket = null) {
    const room = rooms.get(roomName);
    if (!room) return;

    const target = targetSocket || io.to(roomName);
    const socketId = targetSocket?.id;

    // Create a deep copy of potentially large/nested objects to avoid mutation issues
    const playersCopy = JSON.parse(JSON.stringify(room.players));
    const teamsCopy = JSON.parse(JSON.stringify(room.teams));
    const teamScoresCopy = JSON.parse(JSON.stringify(room.teamScores));
    const activePlayerCopy = room.activePlayer ? JSON.parse(JSON.stringify(room.activePlayer)) : null;

    const state = {
        gameState: room.gameState,
        teams: teamsCopy,
        players: playersCopy,
        teamScores: teamScoresCopy,
        activeTeam: room.activeTeam,
        activePlayer: activePlayerCopy,
        turnActive: room.turnActive,
        hatCount: room.hat?.length ?? 0,
        currentWord: room.turnActive && room.activePlayer?.id === socketId ? room.currentWord : null,
        turnEndTime: room.turnActive && room.turnStartTime ? room.turnStartTime + TURN_DURATION_MS : null,
        allWordsSubmitted: room.allWordsSubmitted,
    };

    target.emit("gameStateUpdate", state);
}

// Start the game
function startGame(io, rooms, roomName, socket) {
    const room = rooms.get(roomName);
    if (!room) return;

    // Validate teams are balanced
    const team1Count = room.teams["Team 1"].length;
    const team2Count = room.teams["Team 2"].length;
    if (Math.abs(team1Count - team2Count) > 1) {
        socket.emit("error", "Teams must be balanced before starting the game.");
        return;
    }

    // Reset game state
    room.gameState = "wordSubmission";
    room.currentRound = 0;
    room.teamScores = {
        "Team 1": { total: 0, roundScores: [0, 0, 0] },
        "Team 2": { total: 0, roundScores: [0, 0, 0] },
    };
    room.activeTeam = null;
    room.activePlayer = null;
    room.turnActive = false;
    room.teamPlayerIndex = { "Team 1": -1, "Team 2": -1 };

    // Emit gameStarted event to all players in the room
    io.to(roomName).emit("gameStarted");

    // Emit updated game state
    emitGameState(io, rooms, roomName);

    log("info", roomName, "Game started successfully, transitioning to word submission phase");
}

// Handle word submission
function handleWordSubmission(io, rooms, roomName, socket, words) {
    const room = rooms.get(roomName);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Validate word count
    if (words.length !== REQUIRED_WORDS_PER_PLAYER) {
        socket.emit("error", `Please submit exactly ${REQUIRED_WORDS_PER_PLAYER} words.`);
        return;
    }

    // Validate words are unique
    const uniqueWords = new Set(words);
    if (uniqueWords.size !== words.length) {
        socket.emit("error", "All words must be unique.");
        return;
    }

    // Validate words are not empty
    if (words.some((word) => !word.trim())) {
        socket.emit("error", "Words cannot be empty.");
        return;
    }

    // Update player's words
    player.words = words;

    // Check if all players have submitted their words
    const allWordsSubmitted = room.players.every((p) => p.words?.length === REQUIRED_WORDS_PER_PLAYER);
    room.allWordsSubmitted = allWordsSubmitted;

    // Emit updated game state
    emitGameState(io, rooms, roomName);
    log("info", roomName, `Player ${player.name} submitted ${words.length} words`);

    // If all players have submitted, transition to gameplay
    if (allWordsSubmitted) {
        log("info", roomName, `All players have submitted their words. Transitioning to gameplay.`);
        room.gameState = "playing";

        // Emit allWordsSubmitted event to all players
        io.to(roomName).emit("allWordsSubmitted");

        // Emit updated game state
        emitGameState(io, rooms, roomName);
    }
}

module.exports = {
    emitGameState,
    startGame,
    handleWordSubmission,
};
