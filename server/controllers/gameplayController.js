// Gameplay controller

const { log } = require("../utils/helpers");
const { emitGameState } = require("./gameStateController");
const { TURN_DURATION_MS } = require("../models/Room");

// Start a turn
function startTurn(io, rooms, roomName) {
    const room = rooms.get(roomName);
    if (!room) return;

    // Check if there are words in the hat
    if (room.hat.length === 0) {
        log("info", roomName, "No words left in hat, ending game");
        endGame(io, rooms, roomName);
        return;
    }

    // Get next player
    const teamPlayers = room.players.filter((p) => p.team === room.activeTeam && p.isConnected);
    if (teamPlayers.length === 0) {
        log("warn", roomName, `No active players in team ${room.activeTeam}`);
        return;
    }

    room.teamPlayerIndex = (room.teamPlayerIndex + 1) % teamPlayers.length;
    const activePlayer = teamPlayers[room.teamPlayerIndex];

    // Get word from hat
    const wordIndex = Math.floor(Math.random() * room.hat.length);
    const word = room.hat[wordIndex];
    room.hat.splice(wordIndex, 1);

    // Set up turn
    room.turnActive = true;
    room.activePlayer = activePlayer;
    room.currentWord = word;
    room.guessedWordsThisTurn = [];

    // Start turn timer
    room.turnTimer = setTimeout(() => {
        endTurn(io, rooms, roomName, true);
    }, TURN_DURATION_MS);

    // Emit turn start event
    io.to(roomName).emit("turnStart", {
        team: room.activeTeam,
        player: activePlayer,
        word: word,
        timeLeft: TURN_DURATION_MS,
    });

    // Emit updated game state
    emitGameState(io, rooms, roomName);
}

// Handle word guess
function handleGuess(io, rooms, socket, { word }) {
    const room = Array.from(rooms.values()).find((r) => r.players.some((p) => p.id === socket.id));
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Validate guess
    if (!room.turnActive) {
        return socket.emit("error", "No active turn");
    }

    if (player.team !== room.activeTeam) {
        return socket.emit("error", "Not your team's turn");
    }

    if (player.id !== room.activePlayer.id) {
        return socket.emit("error", "Not your turn to guess");
    }

    // Check if word is in allWords
    const wordIndex = room.allWords.findIndex((w) => w.toLowerCase() === word.toLowerCase());
    if (wordIndex === -1) {
        return socket.emit("error", "Word not found in game");
    }

    // Check if word was already guessed this turn
    if (room.guessedWordsThisTurn.some((w) => w.toLowerCase() === word.toLowerCase())) {
        return socket.emit("error", "Word already guessed this turn");
    }

    // Add word to guessed words
    room.guessedWordsThisTurn.push(room.allWords[wordIndex]);

    // Update scores
    room.teamScores[room.activeTeam]++;

    // Emit guess event
    io.to(room.name).emit("wordGuessed", {
        word: room.allWords[wordIndex],
        team: room.activeTeam,
        player: player.name,
        score: room.teamScores[room.activeTeam],
    });

    // Check if all words are guessed
    if (room.guessedWordsThisTurn.length === room.allWords.length) {
        endGame(io, rooms, room.name);
        return;
    }

    // Emit updated game state
    emitGameState(io, rooms, room.name);
}

// End the game
function endGame(io, rooms, roomName) {
    const room = rooms.get(roomName);
    if (!room) return;

    // Clear any active turn
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    // Set game state to finished
    room.gameState = "finished";

    // Determine winner
    const scores = Object.entries(room.teamScores);
    const maxScore = Math.max(...scores.map(([_, score]) => score));
    const winners = scores.filter(([_, score]) => score === maxScore);

    // Emit game end event
    io.to(roomName).emit("gameEnd", {
        scores: room.teamScores,
        winners: winners.map(([team]) => team),
        maxScore,
    });

    // Emit final game state
    emitGameState(io, rooms, roomName);
}

module.exports = {
    startTurn,
    handleGuess,
    endGame,
};
