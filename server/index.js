const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Adjust if your client runs elsewhere
        methods: ["GET", "POST"],
    },
});

// Store active rooms: Map<roomName, RoomData>
const rooms = new Map();
// Store player sessions for reconnects: Map<sessionId, SessionData>
const playerSessions = new Map();

const TURN_DURATION_MS = 30 * 1000; // 30 seconds per turn
const REQUIRED_WORDS_PER_PLAYER = 5; // As per rules

// --- Helper Functions ---

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
function getSafeRoom(roomName, socket, operation = "Operation") {
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

// Send full game state update to a specific socket or whole room
function emitGameState(roomName, targetSocket = null) {
    const room = rooms.get(roomName);
    if (!room) return;

    const target = targetSocket || io.to(roomName);
    const socketId = targetSocket?.id;

    // Create a deep copy of potentially large/nested objects to avoid mutation issues
    const playersCopy = JSON.parse(JSON.stringify(room.players));
    const teamsCopy = JSON.parse(JSON.stringify(room.teams));
    const teamScoresCopy = JSON.parse(JSON.stringify(room.teamScores));
    const activePlayerCopy = room.activePlayer ? JSON.parse(JSON.stringify(room.activePlayer)) : null;

    // Log the number of players for debugging
    log("info", roomName, `Emitting game state with ${playersCopy.length} players`);

    const state = {
        gameState: room.gameState,
        currentRound: room.currentRound,
        roundInfo: room.rounds && room.currentRound >= 0 ? room.rounds[room.currentRound] : null,
        teams: teamsCopy,
        players: playersCopy,
        teamScores: teamScoresCopy,
        activeTeam: room.activeTeam,
        activePlayer: activePlayerCopy,
        turnActive: room.turnActive,
        hatCount: room.hat?.length ?? 0,
        // Send current word ONLY to the active player during their turn
        currentWord: room.turnActive && room.activePlayer?.id === socketId ? room.currentWord : null,
        turnEndTime: room.turnActive && room.turnStartTime ? room.turnStartTime + TURN_DURATION_MS : null,
        isLeader: room.leaderId === socketId,
        leaderId: room.leaderId,
        wordSubmissionStatus: room.players.reduce((acc, p) => {
            acc[p.id] = p.words?.length === REQUIRED_WORDS_PER_PLAYER;
            return acc;
        }, {}),
        allWordsSubmitted: room.allWordsSubmitted,
    };

    target.emit("gameStateUpdate", state);
}

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

// --- Core Room and Player Management ---

function initializeRoom(roomName, leaderSocketId, leaderName) {
    const newRoom = {
        name: roomName,
        players: [], // {id, name, team, words, isConnected}
        gameState: "waiting", // waiting, playing, round_over, finished
        teams: { "Team 1": [], "Team 2": [] }, // Holds player *objects* {id, name}
        leaderId: leaderSocketId,
        leaderName: leaderName,
        allWords: [],
        fullHat: [], // Persists all unique words for the game
        hat: [], // Words for the current round
        currentRound: -1, // -1: not started, 0: Describe, 1: One Word, 2: Draw/Act
        rounds: [
            { name: "Describe", description: "Explain the word using multiple words." },
            { name: "One Word", description: "Use only ONE word to describe." },
            { name: "Draw / Act", description: "Draw or act out the word." },
        ],
        teamScores: {
            "Team 1": { total: 0, roundScores: [0, 0, 0] },
            "Team 2": { total: 0, roundScores: [0, 0, 0] },
        },
        activeTeam: null, // Team name ('Team 1' or 'Team 2')
        activePlayer: null, // Player object {id, name}
        turnActive: false,
        turnTimer: null,
        turnStartTime: null,
        currentWord: null,
        guessedWordsThisTurn: [], // Words guessed in the current 30s turn
        teamPlayerIndex: { "Team 1": -1, "Team 2": -1 }, // Tracks next player index for round-robin within team
        allWordsSubmitted: false,
    };
    rooms.set(roomName, newRoom);
    log("info", roomName, `Room created by ${leaderName} (${leaderSocketId})`);
    return newRoom;
}

function addPlayerToRoom(room, socket, playerName, isLeader) {
    const newPlayer = {
        id: socket.id,
        name: playerName,
        team: null,
        words: [],
        isConnected: true,
    };
    room.players.push(newPlayer);
    socket.join(room.name);

    const sessionId = generateSessionId();
    playerSessions.set(sessionId, {
        socketId: socket.id,
        roomName: room.name,
        playerName: playerName,
    });

    log("info", room.name, `Player ${playerName} (${socket.id}) joined. Total players: ${room.players.length}`);

    // Send confirmation JUST to the joiner
    socket.emit("roomJoined", {
        roomName: room.name,
        sessionId,
        playerName: playerName,
        isLeader: isLeader,
    });

    // Send the FULL game state to EVERYONE in the room after join
    emitGameState(room.name); // Send to all

    // Also emit a specific playerJoined event for backward compatibility
    io.to(room.name).emit("playerJoined", { players: room.players });
}

function removePlayerFromRoom(room, playerIndex, wasLeader) {
    const player = room.players[playerIndex];
    log("info", room.name, `Removing player ${player.name} (${player.id}) from ${room.gameState} room.`);
    room.players.splice(playerIndex, 1);

    // Remove player reference from their team
    if (player.team && room.teams[player.team]) {
        room.teams[player.team] = room.teams[player.team].filter((p) => p.id !== player.id);
    }

    if (room.players.length === 0) {
        log("info", room.name, `Room empty. Deleting.`);
        if (room.turnTimer) clearTimeout(room.turnTimer);
        rooms.delete(room.name);
        // Clean up associated sessions
        playerSessions.forEach((session, sid) => {
            if (session.roomName === room.name) {
                playerSessions.delete(sid);
            }
        });
        return { roomDeleted: true };
    }

    let newLeaderAssigned = false;
    if (wasLeader && (room.gameState === "waiting" || room.gameState === "finished")) {
        const newLeader = room.players.find((p) => p.isConnected) || room.players[0]; // Prefer connected player
        if (newLeader) {
            room.leaderId = newLeader.id;
            room.leaderName = newLeader.name;
            log("info", room.name, `Assigned new leader: ${newLeader.name} (${newLeader.id})`);
            newLeaderAssigned = true;
            io.to(newLeader.id).emit("becameLeader"); // Notify new leader
        } else {
            room.leaderId = null;
            room.leaderName = null;
            log("warn", room.name, "Leader left, but no other players to assign leadership.");
        }
    }

    // Notify remaining players of the changes
    io.to(room.name).emit("playerLeft", { players: room.players, teams: room.teams, leaderId: room.leaderId });

    return { roomDeleted: false, newLeaderAssigned };
}

// --- Game Logic Functions ---

function startGame(roomName, socket) {
    const room = getSafeRoom(roomName, socket, "Start game");
    if (!room) return;

    // Validate all players have submitted their words
    const allWordsSubmitted = room.players.every((p) => p.words?.length === REQUIRED_WORDS_PER_PLAYER);
    if (!allWordsSubmitted) {
        socket.emit("error", "All players must submit their words before starting the game.");
        return;
    }

    // Validate teams are balanced
    const team1Count = room.teams["Team 1"].length;
    const team2Count = room.teams["Team 2"].length;
    if (Math.abs(team1Count - team2Count) > 1) {
        socket.emit("error", "Teams must be balanced before starting the game.");
        return;
    }

    // Prepare the hat with all words
    room.fullHat = [];
    room.players.forEach((player) => {
        room.fullHat.push(...player.words);
    });

    // Shuffle the hat
    for (let i = room.fullHat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.fullHat[i], room.fullHat[j]] = [room.fullHat[j], room.fullHat[i]];
    }

    // Initialize the hat for the first round
    room.hat = [...room.fullHat];

    // Reset game state
    room.gameState = "playing";
    room.currentRound = 0;
    room.teamScores = {
        "Team 1": { total: 0, roundScores: [0, 0, 0] },
        "Team 2": { total: 0, roundScores: [0, 0, 0] },
    };
    room.activeTeam = null;
    room.activePlayer = null;
    room.turnActive = false;
    room.teamPlayerIndex = { "Team 1": -1, "Team 2": -1 };

    // Start the first turn
    startNextTurn(roomName);
    log("info", roomName, "Game started successfully");
}

function handleWordSubmission(roomName, socket, words) {
    const room = getSafeRoom(roomName, socket, "Word submission");
    if (!room) return;

    const player = getSafePlayer(room, socket.id, socket, "Word submission");
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
    emitGameState(roomName);
    log("info", roomName, `Player ${player.name} submitted ${words.length} words`);
}

function handleWordGuess(roomName, socket, guessedWord) {
    const room = getSafeRoom(roomName, socket, "Word guess");
    if (!room) return;

    const player = getSafePlayer(room, socket.id, socket, "Word guess");
    if (!player) return;

    // Validate it's the player's turn to guess
    const isGuessingTeam = room.teams[room.activeTeam].some((p) => p.id === socket.id);
    if (!isGuessingTeam) {
        socket.emit("error", "It's not your team's turn to guess.");
        return;
    }

    // Check if the guess matches the current word
    if (guessedWord.toLowerCase() === room.currentWord.toLowerCase()) {
        // Add to guessed words for this turn
        room.guessedWordsThisTurn.push(room.currentWord);

        // Update team score
        room.teamScores[room.activeTeam].total++;
        room.teamScores[room.activeTeam].roundScores[room.currentRound]++;

        // Get next word from hat
        room.currentWord = room.hat.pop();

        // If hat is empty, end the round
        if (room.hat.length === 0) {
            endRound(roomName);
            return;
        }

        // Emit success and updated state
        socket.emit("guessSuccess", { word: guessedWord });
        emitGameState(roomName);
        log("info", roomName, `Team ${room.activeTeam} correctly guessed "${guessedWord}"`);
    } else {
        socket.emit("guessError", { message: "Incorrect guess. Try again!" });
    }
}

function startNextTurn(roomName) {
    const room = rooms.get(roomName);
    if (!room) {
        log("error", roomName, "Cannot start next turn: Room not found");
        return;
    }

    // Find next active team
    if (!room.activeTeam) {
        room.activeTeam = "Team 1";
    } else {
        room.activeTeam = room.activeTeam === "Team 1" ? "Team 2" : "Team 1";
    }

    // Get connected players in the active team
    const teamPlayers = room.teams[room.activeTeam].filter((player) => {
        const fullPlayer = room.players.find((p) => p.id === player.id);
        return fullPlayer && fullPlayer.isConnected;
    });

    if (teamPlayers.length === 0) {
        log("warn", roomName, `No connected players in team ${room.activeTeam}, skipping turn`);
        return;
    }

    // Update team player index
    room.teamPlayerIndex[room.activeTeam] = (room.teamPlayerIndex[room.activeTeam] + 1) % teamPlayers.length;
    const nextPlayer = teamPlayers[room.teamPlayerIndex[room.activeTeam]];

    // Set active player
    room.activePlayer = nextPlayer;
    room.turnActive = true;
    room.turnStartTime = Date.now();
    room.currentWord = room.hat.pop();
    room.guessedWordsThisTurn = [];

    // Clear any existing turn timer
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
    }

    // Set new turn timer
    room.turnTimer = setTimeout(() => handleTurnTimeout(roomName), TURN_DURATION_MS);

    // Emit updated game state
    emitGameState(roomName);
    log("info", roomName, `Turn started for ${nextPlayer.name} in ${room.activeTeam}`);
}

function handleTurnTimeout(roomName) {
    const room = rooms.get(roomName);
    if (!room) return;

    log("info", roomName, `Turn timeout for ${room.activePlayer?.name}`);

    // End the current turn
    endTurn(roomName, true);

    // Start next turn
    startNextTurn(roomName);
}

function endTurn(roomName, triggeredByPlayer = false) {
    const room = rooms.get(roomName);
    if (!room) return;

    // Clear turn timer
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    // If the turn was ended by a player (not timeout), add the current word back to the hat
    if (!triggeredByPlayer && room.currentWord) {
        room.hat.push(room.currentWord);
    }

    // Reset turn state
    room.turnActive = false;
    room.activePlayer = null;
    room.currentWord = null;
    room.guessedWordsThisTurn = [];

    // Emit turn end event
    io.to(roomName).emit("turnEnd", {
        team: room.activeTeam,
        guessedWords: room.guessedWordsThisTurn,
    });

    // Emit updated game state
    emitGameState(roomName);
}

function endRound(roomName) {
    const room = rooms.get(roomName);
    if (!room) {
        log("error", roomName, "Cannot end round: Room not found");
        return;
    }

    // Clear any active turn timer
    if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    // Reset turn state
    room.turnActive = false;
    room.activePlayer = null;
    room.currentWord = null;
    room.guessedWordsThisTurn = [];

    // Check if this was the last round
    if (room.currentRound >= room.rounds.length - 1) {
        // Game is finished
        room.gameState = "finished";
        const winner = getWinner(room.teamScores);

        // Emit game over state
        io.to(roomName).emit("gameOver", {
            winner,
            finalScores: room.teamScores,
        });

        log("info", roomName, `Game finished. Winner: ${winner}`);
    } else {
        // Prepare for next round
        room.currentRound++;
        room.hat = [...room.fullHat]; // Reset hat with all words

        // Shuffle the hat for the new round
        for (let i = room.hat.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.hat[i], room.hat[j]] = [room.hat[j], room.hat[i]];
        }

        // Reset round-specific state
        room.activeTeam = null;
        room.teamPlayerIndex = { "Team 1": -1, "Team 2": -1 };

        // Emit round end and new round start
        io.to(roomName).emit("roundEnd", {
            roundNumber: room.currentRound - 1,
            scores: room.teamScores,
        });

        io.to(roomName).emit("roundStart", {
            roundNumber: room.currentRound,
            roundInfo: room.rounds[room.currentRound],
        });

        // Start the first turn of the new round
        startNextTurn(roomName);
    }

    // Emit updated game state
    emitGameState(roomName);
}

function startNextRound(roomName, socket) {
    const room = getSafeRoom(roomName, socket, "Start Next Round");
    if (!room) return;

    if (socket.id !== room.leaderId) {
        return socket.emit("error", "Only the room leader can start the next round.");
    }
    if (room.gameState !== "round_over") {
        return socket.emit("error", `Cannot start next round, current state is ${room.gameState}.`);
    }

    room.currentRound++;
    const nextRoundIndex = room.currentRound;

    log("info", roomName, `Leader attempting to start round ${nextRoundIndex}`);

    if (nextRoundIndex >= room.rounds.length) {
        // Game Over
        room.gameState = "finished";
        const winner = getWinner(room.teamScores);
        log("info", roomName, `Game finished. Winner: ${winner}`);
        io.to(roomName).emit("gameEnded", {
            teamScores: room.teamScores,
            winner: winner,
        });
        emitGameState(roomName); // Send final state
    } else {
        // Start the next round
        room.gameState = "playing";
        room.hat = [...room.fullHat].sort(() => Math.random() - 0.5); // Refill and shuffle hat

        log(
            "info",
            roomName,
            `Starting round ${nextRoundIndex}: ${room.rounds[nextRoundIndex].name}. Hat refilled: ${room.hat.length}`
        );

        io.to(roomName).emit("nextRoundStarted", {
            currentRound: nextRoundIndex,
            roundInfo: room.rounds[nextRoundIndex],
            hatCount: room.hat.length,
            teamScores: room.teamScores,
        });

        // Start the first turn of the new round
        startNextTurn(roomName); // Will determine first team/player for the new round
    }
}

// --- Socket Event Handlers ---

io.on("connection", (socket) => {
    log("info", null, `Client connected: ${socket.id}`);

    // --- Connection/Setup Handlers ---
    socket.on("checkSession", ({ sessionId }) => {
        log("info", null, `Check session request from ${socket.id} for session: ${sessionId}`);
        if (!sessionId || !playerSessions.has(sessionId)) {
            log("warn", null, `Invalid or unknown session ID: ${sessionId}`);
            return socket.emit("sessionInvalid");
        }

        const sessionData = playerSessions.get(sessionId);
        const roomName = sessionData.roomName;
        const room = rooms.get(roomName);

        if (!room) {
            log("warn", roomName, `Room not found during reconnect for session ${sessionId}. Cleaning up session.`);
            playerSessions.delete(sessionId);
            return socket.emit("sessionInvalid");
        }

        const playerIndex = room.players.findIndex((p) => p.name === sessionData.playerName);
        if (playerIndex === -1) {
            log(
                "warn",
                roomName,
                `Player ${sessionData.playerName} not found in room during reconnect check. Session mismatch? Cleaning up.`
            );
            playerSessions.delete(sessionId);
            return socket.emit("sessionInvalid");
        }

        // Player found, handle reconnect
        const player = room.players[playerIndex];
        const oldSocketId = player.id;
        log("info", roomName, `Reconnecting player: ${player.name} (Old ID: ${oldSocketId}, New ID: ${socket.id})`);

        // Update socket ID and status everywhere
        player.id = socket.id;
        player.isConnected = true;

        if (player.team && room.teams[player.team]) {
            const teamPlayer = room.teams[player.team].find((p) => p.name === player.name);
            if (teamPlayer) teamPlayer.id = socket.id;
        }
        if (room.activePlayer?.name === player.name) {
            // Update active player ID if they were active
            room.activePlayer.id = socket.id;
        }
        if (room.leaderName === player.name) {
            // Restore leader ID
            room.leaderId = socket.id;
        }

        // Update session map
        sessionData.socketId = socket.id;
        playerSessions.set(sessionId, sessionData);

        socket.join(roomName);

        // Confirm join JUST to the reconnecter
        socket.emit("roomJoined", {
            roomName,
            sessionId,
            playerName: player.name,
            isLeader: room.leaderId === socket.id,
        });

        // Send the FULL game state to EVERYONE in the room after reconnect
        emitGameState(roomName); // Send to all

        // Notify others about the updated player list (REMOVED - Handled by emitGameState now)
        // io.to(roomName).emit("playerListUpdate", { players: room.players });
    });

    socket.on("joinRoom", ({ roomName, playerName }) => {
        roomName = roomName?.trim();
        playerName = playerName?.trim();

        if (!roomName || !playerName) return socket.emit("error", "Room name and player name are required.");
        if (playerName.length > 15) return socket.emit("error", "Player name cannot exceed 15 characters.");

        let room = rooms.get(roomName);
        let isLeader = false;

        if (!room) {
            isLeader = true;
            room = initializeRoom(roomName, socket.id, playerName);
            log("info", roomName, `New room created with leader ${playerName}`);
        } else {
            if (room.gameState !== "waiting" && room.gameState !== "finished") {
                return socket.emit("error", "Cannot join room: Game is in progress.");
            }
            const existingPlayer = room.players.find((p) => p.name === playerName);
            if (existingPlayer?.isConnected) {
                return socket.emit("error", `Player name '${playerName}' is already taken.`);
            }
            if (existingPlayer && !existingPlayer.isConnected) {
                log("warn", roomName, `Player ${playerName} trying to rejoin via joinRoom. Use 'Reconnect'.`);
                return socket.emit("error", `Reconnect using your previous session.`);
            }
            log("info", roomName, `Player ${playerName} joining existing room with ${room.players.length} players`);
        }
        addPlayerToRoom(room, socket, playerName, isLeader);
    });

    socket.on("assignTeam", ({ roomName, playerId, teamName }) => {
        const room = getSafeRoom(roomName, socket, "Assign Team");
        if (!room || socket.id !== room.leaderId) return; // Error handled by getSafeRoom or leader check
        if (room.gameState !== "waiting") return socket.emit("error", "Teams can only be assigned before the game starts.");
        if (!playerId || (teamName !== "Team 1" && teamName !== "Team 2"))
            return socket.emit("error", "Invalid player or team name.");

        const player = room.players.find((p) => p.id === playerId);
        if (!player) return socket.emit("error", "Player not found.");

        // Remove from old team
        if (player.team && room.teams[player.team]) {
            room.teams[player.team] = room.teams[player.team].filter((p) => p.id !== playerId);
        }
        // Add to new team (add player *object*)
        player.team = teamName;
        if (!room.teams[teamName].some((p) => p.id === playerId)) {
            // Avoid duplicates if somehow called twice
            room.teams[teamName].push({ id: player.id, name: player.name }); // Store basic info in team list
        }

        log("info", roomName, `Assigned ${player.name} to ${teamName}`);
        // Send updated player list (containing team info) and teams structure
        io.to(roomName).emit("teamsUpdated", { players: room.players, teams: room.teams });
        emitGameState(roomName); // Send full state as teams affect UI
    });

    socket.on("submitWords", ({ roomName, words }) => {
        const room = getSafeRoom(roomName, socket, "Submit Words");
        if (!room) return;
        const player = getSafePlayer(room, socket.id, socket, "Submit Words");
        if (!player) return;
        if (room.gameState !== "waiting") return socket.emit("error", "Words can only be submitted before start.");

        if (
            !Array.isArray(words) ||
            words.length !== REQUIRED_WORDS_PER_PLAYER ||
            words.some((w) => !w || typeof w !== "string" || w.trim().length === 0 || w.length > 30)
        ) {
            return socket.emit(
                "error",
                `Submit exactly ${REQUIRED_WORDS_PER_PLAYER} unique, non-empty words (max 30 chars).`
            );
        }
        // Basic duplicate check within submission
        const uniqueWords = [...new Set(words.map((w) => w.trim()))];
        if (uniqueWords.length !== REQUIRED_WORDS_PER_PLAYER) {
            return socket.emit("error", "Submitted words must be unique.");
        }

        player.words = uniqueWords;
        log("info", roomName, `Player ${player.name} submitted ${player.words.length} words.`);
        socket.emit("wordsAccepted");

        // Update and emit submission status for UI
        const submissionStatus = room.players.reduce((acc, p) => {
            acc[p.id] = p.words?.length === REQUIRED_WORDS_PER_PLAYER;
            return acc;
        }, {});
        io.to(roomName).emit("playerSubmissionUpdate", submissionStatus);

        // Check if ALL connected players have submitted
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        const allConnectedSubmitted =
            connectedPlayers.length > 0 && connectedPlayers.every((p) => p.words?.length === REQUIRED_WORDS_PER_PLAYER);

        if (allConnectedSubmitted && !room.allWordsSubmitted) {
            log("info", roomName, `All connected players (${connectedPlayers.length}) submitted words.`);
            room.allWords = [];
            connectedPlayers.forEach((p) => room.allWords.push(...p.words));
            // Ensure uniqueness across all submitted words (optional, but good practice)
            room.allWords = [...new Set(room.allWords)];
            room.fullHat = [...room.allWords].sort(() => Math.random() - 0.5);
            room.hat = [];
            room.allWordsSubmitted = true;

            log("info", roomName, `Collected ${room.fullHat.length} total unique words. Ready for leader.`);
            io.to(roomName).emit("allWordsSubmitted", { wordCount: room.fullHat.length, canStart: true });
        }
    });

    // --- Gameplay Handlers ---
    socket.on("startGame", ({ roomName }) => {
        startGame(roomName, socket);
    });

    socket.on("startNextRound", ({ roomName }) => {
        startNextRound(roomName, socket);
    });

    socket.on("drawWord", ({ roomName }) => {
        const room = getSafeRoom(roomName, socket, "Draw Word");
        if (!room || !room.turnActive || room.gameState !== "playing") return;
        const player = getSafePlayer(room, socket.id, socket, "Draw Word");
        if (!player || !room.activePlayer || player.id !== room.activePlayer.id)
            return socket.emit("error", "Not your turn.");
        if (room.currentWord) return socket.emit("error", "You already have a word.");

        if (room.hat.length === 0) {
            log("warn", roomName, `Draw attempt but hat empty. Ending round.`);
            endRound(roomName); // Should trigger round end
            return socket.emit("error", "No words left in hat.");
        }

        const wordIndex = Math.floor(Math.random() * room.hat.length);
        room.currentWord = room.hat.splice(wordIndex, 1)[0]; // Remove word

        log("info", roomName, `${player.name} drew word: ****. Hat: ${room.hat.length}`); // Don't log word itself

        // Send word ONLY to the active player, update hat count for others
        socket.emit("wordDrawn", { word: room.currentWord, hatCount: room.hat.length });
        socket.to(roomName).emit("gameStateUpdate", { hatCount: room.hat.length }); // Just update count for others
    });

    socket.on("wordGuessed", ({ roomName /*, guessedWord - client doesn't need to send it */ }) => {
        const room = getSafeRoom(roomName, socket, "Word Guessed");
        if (!room || !room.turnActive || room.gameState !== "playing") return;
        const player = getSafePlayer(room, socket.id, socket, "Word Guessed");
        // Only the active player's confirmation counts
        if (!player || !room.activePlayer || player.id !== room.activePlayer.id)
            return socket.emit("error", "Not your turn to confirm guess.");
        if (!room.currentWord) return socket.emit("error", "No word drawn to be guessed.");

        const wordJustGuessed = room.currentWord;
        room.currentWord = null; // Clear current word

        // Increment score
        const teamScore = room.teamScores[room.activeTeam];
        if (teamScore && teamScore.roundScores) {
            // Check if exists
            teamScore.roundScores[room.currentRound]++;
            teamScore.total = teamScore.roundScores.reduce((a, b) => a + b, 0);
        } else {
            log("error", roomName, `Team score structure missing for team ${room.activeTeam}`);
        }

        room.guessedWordsThisTurn.push(wordJustGuessed);

        log("info", roomName, `Word '${wordJustGuessed}' confirmed guessed by ${player.name} for team ${room.activeTeam}.`);

        // Notify everyone of score update and guessed word
        io.to(roomName).emit("scoreUpdated", {
            teamScores: room.teamScores,
            hatCount: room.hat.length,
            lastGuessedWord: wordJustGuessed,
            guessingTeam: room.activeTeam,
        });

        // Check if hat is empty AFTER processing guess
        if (room.hat.length === 0) {
            endRound(roomName); // Round ends immediately
        } else {
            // Player can now draw the next word
            socket.emit("canDrawNextWord"); // Signal UI to re-enable draw button
        }
    });

    socket.on("skipWord", ({ roomName }) => {
        const room = getSafeRoom(roomName, socket, "Skip Word");
        if (!room || !room.turnActive || room.gameState !== "playing") return;
        const player = getSafePlayer(room, socket.id, socket, "Skip Word");
        if (!player || !room.activePlayer || player.id !== room.activePlayer.id)
            return socket.emit("error", "Not your turn.");
        if (!room.currentWord) return socket.emit("error", "No word drawn to skip.");

        const skippedWord = room.currentWord;
        room.currentWord = null;

        // Put skipped word back into the hat
        room.hat.push(skippedWord);
        // Optional: Shuffle? room.hat.sort(() => Math.random() - 0.5);

        log("info", roomName, `${player.name} skipped word '****'. Hat: ${room.hat.length}`);

        // Notify player they can draw again and others of hat count change
        socket.emit("canDrawNextWord");
        io.to(roomName).emit("gameStateUpdate", { hatCount: room.hat.length, lastAction: "skip" });
    });

    socket.on("endTurn", ({ roomName }) => {
        // Player manually clicks "Done"
        const room = getSafeRoom(roomName, socket, "Manual End Turn");
        if (!room || !room.turnActive || room.gameState !== "playing") return;
        const player = getSafePlayer(room, socket.id, socket, "Manual End Turn");
        if (!player || !room.activePlayer || player.id !== room.activePlayer.id)
            return socket.emit("error", "Not your turn.");

        log("info", roomName, `${player.name} manually ended their turn.`);
        endTurn(roomName, true); // End the turn, triggered by player
    });

    // --- Disconnect and Leave Logic ---
    socket.on("leaveRoom", ({ roomName }) => {
        log("info", roomName, `Leave request from ${socket.id}`);
        handleDisconnectOrLeave(socket, roomName, true);
    });

    socket.on("disconnect", (reason) => {
        log("info", null, `Client disconnected: ${socket.id}. Reason: ${reason}`);
        handleDisconnectOrLeave(socket, null, false);
    });

    function handleDisconnectOrLeave(socket, explicitRoomName, isExplicitLeave) {
        const session = Array.from(playerSessions.values()).find((s) => s.socketId === socket.id);
        const roomName = explicitRoomName || (session ? session.roomName : null);

        if (!roomName) {
            log("warn", null, `Socket ${socket.id} disconnected without room context`);
            return;
        }

        const room = rooms.get(roomName);
        if (!room) {
            log("warn", roomName, `Room ${roomName} not found during disconnect/leave`);
            return;
        }

        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex === -1) {
            log("warn", roomName, `Player ${socket.id} not found in room during disconnect/leave`);
            return;
        }

        const player = room.players[playerIndex];
        const wasLeader = room.leaderId === socket.id;
        const wasActivePlayer = room.activePlayer?.id === socket.id;

        // Mark player as disconnected but don't remove them yet
        player.isConnected = false;

        // If this was the active player, handle turn transition
        if (wasActivePlayer && room.turnActive) {
            log("info", roomName, `Active player ${player.name} disconnected, ending turn`);
            endTurn(roomName, true);
        }

        // If this was the leader, transfer leadership
        if (wasLeader) {
            const newLeader = room.players.find((p) => p.isConnected);
            if (newLeader) {
                room.leaderId = newLeader.id;
                room.leaderName = newLeader.name;
                log("info", roomName, `Leadership transferred to ${newLeader.name}`);
            }
        }

        // Remove player session
        const sessionToRemove = Array.from(playerSessions.entries()).find(([_, s]) => s.socketId === socket.id);
        if (sessionToRemove) {
            playerSessions.delete(sessionToRemove[0]);
        }

        // Check if room should be cleaned up
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        if (connectedPlayers.length === 0) {
            log("info", roomName, `All players disconnected, cleaning up room`);
            rooms.delete(roomName);
        } else {
            // Update game state for remaining players
            emitGameState(roomName);
        }
    }

    // Request state (e.g., for manual sync button or on component mount)
    socket.on("requestGameState", ({ roomName }) => {
        const room = getSafeRoom(roomName, socket, "Request Game State");
        if (!room) return;
        const player = getSafePlayer(room, socket.id, socket, "Request Game State");
        if (!player) return; // Safety check

        log("info", roomName, `Sending full game state to ${player.name} on request.`);
        emitGameState(roomName, socket); // Send the current full state to the requester
    });
}); // End io.on("connection")

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Turn duration: ${TURN_DURATION_MS / 1000}s, Words per player: ${REQUIRED_WORDS_PER_PLAYER}`);
});
