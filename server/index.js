const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Store active rooms
const rooms = new Map();
// Store player sessions to handle refreshes
const playerSessions = new Map();

// Debug helper function
function logRoomStatus(roomName) {
    const room = rooms.get(roomName);
    if (room) {
        console.log(`Room: ${roomName} - Players: ${room.players.length}`);
        console.log(`Players: ${JSON.stringify(room.players.map((p) => ({ id: p.id, name: p.name })))}`);
    } else {
        console.log(`Room ${roomName} does not exist`);
    }
    console.log(`Total rooms: ${rooms.size}`);
}

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Check if this is a reconnect
    socket.on("checkSession", ({ sessionId, playerName }) => {
        console.log("Checking session:", sessionId);
        if (playerSessions.has(sessionId)) {
            const sessionData = playerSessions.get(sessionId);
            const roomName = sessionData.roomName;
            console.log("Found session for room:", roomName);

            if (rooms.has(roomName)) {
                const room = rooms.get(roomName);
                console.log("Found room for session:", roomName);

                // Get the player index instead of reference to safely update
                const playerIndex = room.players.findIndex((p) => p.name === sessionData.playerName);

                if (playerIndex !== -1) {
                    console.log("Reconnecting player:", playerName);
                    // Update the player's socket ID
                    room.players[playerIndex].id = socket.id;

                    socket.join(roomName);

                    // Send proper object structure for roomJoined (no leader)
                    socket.emit("roomJoined", {
                        roomName,
                        sessionId,
                    });

                    // If game is already started, send current game state
                    if (room.gameState !== "waiting") {
                        console.log(`Rejoining ongoing game in state: ${room.gameState}`);
                        socket.emit("gameStarted", {
                            teams: room.teams,
                            players: room.players,
                        });
                    }

                    // Update session data with new socket ID
                    sessionData.socketId = socket.id;
                    playerSessions.set(sessionId, sessionData);

                    // Send updated player list to all clients in the room
                    io.to(roomName).emit("playerJoined", room.players);

                    logRoomStatus(roomName);
                    return;
                } else {
                    console.log(`Player ${playerName} not found in room ${roomName} during reconnect check.`);
                }
            } else {
                console.log(`Room ${roomName} not found during reconnect check.`);
            }
        } else {
            console.log(`Session ${sessionId} not found.`);
        }

        // If we get here, either the session/room doesn't exist or player isn't in the room
        console.log("Invalid session or room state, redirecting to home");
        socket.emit("sessionInvalid");
    });

    socket.on("joinRoom", ({ roomName, playerName }) => {
        console.log(`Attempting to join room: ${roomName} by player: ${playerName}`);

        // Auto-create room if it doesn't exist
        if (!rooms.has(roomName)) {
            console.log(`Room ${roomName} does not exist. Creating it.`);
            rooms.set(roomName, {
                players: [],
                gameState: "waiting",
                teams: {},
            });
        }

        const room = rooms.get(roomName);

        // Prevent joining if the game has already started
        if (room.gameState !== "waiting") {
            console.log(`Attempt to join room ${roomName} failed: Game already started`);
            socket.emit("error", "Cannot join room: Game has already started");
            return;
        }

        // Generate a unique session ID
        const sessionId = generateSessionId();

        // Check if player with this name already exists
        const existingPlayer = room.players.find((p) => p.name === playerName);
        if (existingPlayer) {
            console.log(`Player ${playerName} already exists in room ${roomName}`);
            socket.emit("error", "A player with this name already exists in the room");
            return;
        }

        // Add player to the room
        const newPlayer = {
            id: socket.id,
            name: playerName,
            team: null,
            words: [],
        };
        room.players.push(newPlayer);
        socket.join(roomName);

        // Save player session
        playerSessions.set(sessionId, {
            socketId: socket.id,
            roomName: roomName,
            playerName: playerName,
        });

        console.log(`Player ${playerName} joined room ${roomName}`);
        socket.emit("roomJoined", { roomName, sessionId }); // No leader info
        io.to(roomName).emit("playerJoined", room.players);
        logRoomStatus(roomName);
    });

    // Handle game start - ANYONE can start
    socket.on("startGame", (roomName) => {
        console.log(`Attempting to start game in room: ${roomName} by socket ${socket.id}`);
        if (rooms.has(roomName)) {
            const room = rooms.get(roomName);

            // Prevent duplicate game starts
            if (room.gameState !== "waiting") {
                console.log(`Game already started or not in waiting state in room ${roomName}`);
                // Maybe emit an error back? For now, just return.
                // socket.emit("error", "Game cannot be started at this time.");
                return;
            }

            // Check if minimum 4 players and even number
            if (room.players.length < 4) {
                console.log(`Start game failed in room ${roomName}: Not enough players (${room.players.length})`);
                io.to(roomName).emit("error", "Minimum 4 players required to start the game");
                return;
            }

            if (room.players.length % 2 !== 0) {
                console.log(`Start game failed in room ${roomName}: Odd number of players (${room.players.length})`);
                io.to(roomName).emit("error", "Number of players must be even");
                return;
            }

            // Verify that there are no duplicate player names or ids (Shouldn't happen with checks, but good safeguard)
            const playerNames = new Set();
            const playerIds = new Set();
            let hasDuplicates = false;

            room.players.forEach((player) => {
                if (playerNames.has(player.name) || playerIds.has(player.id)) {
                    hasDuplicates = true;
                }
                playerNames.add(player.name);
                playerIds.add(player.id);
            });

            if (hasDuplicates) {
                console.error(`CRITICAL: Found duplicates in room ${roomName} before starting game. Aborting start.`);
                io.to(roomName).emit("error", "Internal server error: Duplicate players detected.");
                // Consider more robust cleanup or logging here
                return;
            }

            // Support for more than 2 teams
            const playerCount = room.players.length;
            const maxTeams = Math.floor(playerCount / 2); // At least 2 players per team
            const numTeams = Math.min(maxTeams, 4); // Cap at 4 teams max

            // Clear existing teams and create new team structure
            room.teams = {};
            for (let i = 1; i <= numTeams; i++) {
                room.teams[`team${i}`] = [];
            }

            // Shuffle players
            const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);

            // Reset team assignments before distributing
            shuffledPlayers.forEach((player) => {
                const actualPlayer = room.players.find((p) => p.id === player.id);
                if (actualPlayer) actualPlayer.team = null;
            });

            // Distribute players evenly across teams
            shuffledPlayers.forEach((player, index) => {
                const teamNumber = (index % numTeams) + 1;
                const teamName = `team${teamNumber}`;

                // Find the actual player in the room state to modify
                const actualPlayer = room.players.find((p) => p.id === player.id);
                if (actualPlayer) {
                    actualPlayer.team = teamName;
                    room.teams[teamName].push(actualPlayer.id);
                    console.log(`Assigned ${actualPlayer.name} to ${teamName}`);
                } else {
                    console.error(`Could not find player ${player.id} during team assignment!`);
                }
            });

            // Change game state to word submission phase
            room.gameState = "wordSubmission";

            // Notify all clients about game start, sending team assignments
            console.log(`Game started successfully in room ${roomName} with ${numTeams} teams`);
            io.to(roomName).emit("gameStarted", {
                teams: room.teams,
                players: room.players, // Send the updated players array with team assignments
            });

            logRoomStatus(roomName);
        } else {
            console.log(`Start game failed: Room ${roomName} does not exist.`);
            socket.emit("error", "Cannot start game: Room does not exist.");
        }
    });

    socket.on("submitWords", ({ roomName, words }) => {
        if (rooms.has(roomName)) {
            const room = rooms.get(roomName);
            const player = room.players.find((p) => p.id === socket.id);

            if (player && words.length === 10) {
                player.words = words;
                console.log(`Player ${player.name} submitted words in room ${roomName}`);

                // Check if all players have submitted words
                const allPlayersSubmitted = room.players.every((p) => Array.isArray(p.words) && p.words.length === 10);

                if (allPlayersSubmitted) {
                    room.gameState = "playing"; // Or next phase
                    console.log(`All players submitted words in room ${roomName}. Transitioning state.`);
                    io.to(roomName).emit("allWordsSubmitted", {
                        players: room.players,
                        teams: room.teams,
                    });
                    // Add logic for next game phase if needed
                } else {
                    // Optionally notify others about who has submitted
                    io.to(roomName).emit("playerSubmittedWords", { playerId: player.id });
                    console.log(`Player ${player.name} submitted, waiting for others.`);
                }
            } else if (player) {
                console.log(`Player ${player.name} tried to submit invalid words:`, words);
                socket.emit("error", "Invalid word submission. Please submit exactly 10 words.");
            } else {
                console.log(`Word submission failed: Player not found for socket ${socket.id} in room ${roomName}`);
            }
        }
    });

    socket.on("leaveRoom", (roomName) => {
        console.log(`Player leaving room: ${roomName} (Socket: ${socket.id})`);
        const sessionData = Array.from(playerSessions.entries()).find(([_, data]) => data.socketId === socket.id);

        if (rooms.has(roomName)) {
            const room = rooms.get(roomName);
            const playerIndex = room.players.findIndex((p) => p.id === socket.id);

            if (playerIndex !== -1) {
                const playerName = room.players[playerIndex].name;
                console.log(`Removing player ${playerName} from room ${roomName}`);
                room.players.splice(playerIndex, 1); // Remove player

                if (room.players.length === 0) {
                    console.log(`Room ${roomName} is empty. Deleting.`);
                    rooms.delete(roomName);
                } else {
                    console.log(`Notifying remaining players in ${roomName} about player left.`);
                    io.to(roomName).emit("playerLeft", room.players); // Notify remaining players
                }
                logRoomStatus(roomName);
            } else {
                console.log(`Player with socket ${socket.id} not found in room ${roomName} players list.`);
            }

            socket.leave(roomName);
        } else {
            console.log(`Leave room failed: Room ${roomName} doesn't exist.`);
        }

        // Clean up session regardless of room state
        if (sessionData) {
            const [sessionId, _] = sessionData;
            console.log(`Deleting session ${sessionId} for leaving player.`);
            playerSessions.delete(sessionId);
        } else {
            console.log(`Could not find session data for disconnecting socket ${socket.id}.`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        // Find the session associated with this socket ID
        let sessionToDelete = null;
        let roomName = null;
        let playerName = null;

        for (const [sessionId, data] of playerSessions.entries()) {
            if (data.socketId === socket.id) {
                sessionToDelete = sessionId;
                roomName = data.roomName;
                playerName = data.playerName;
                break;
            }
        }

        if (roomName && rooms.has(roomName)) {
            const room = rooms.get(roomName);
            const playerIndex = room.players.findIndex((p) => p.id === socket.id); // Check using socket ID just in case
            const playerByNameIndex = room.players.findIndex((p) => p.name === playerName); // Fallback check by name

            if (playerIndex !== -1) {
                console.log(
                    `Player ${room.players[playerIndex].name} (Socket: ${socket.id}) disconnected from room ${roomName}. Notifying others.`
                );
                // Just notify, player state is kept for potential reconnect via checkSession
                io.to(roomName).emit("playerDisconnected", room.players);
                logRoomStatus(roomName);
            } else if (playerByNameIndex !== -1) {
                // This might happen if the checkSession logic didn't fully update the ID before disconnect
                console.warn(`Player ${playerName} (found by name) disconnected from room ${roomName}. Notifying others.`);
                io.to(roomName).emit("playerDisconnected", room.players);
                logRoomStatus(roomName);
            } else {
                console.log(
                    `Disconnected socket ${socket.id} was associated with session for ${playerName} in room ${roomName}, but player not found in room list.`
                );
            }
        } else if (roomName) {
            console.log(
                `Disconnected socket ${socket.id} was associated with session for room ${roomName}, but room no longer exists.`
            );
        }

        // We don't delete the session here anymore because checkSession handles reconnects
        // However, maybe add a timeout later to clean up stale sessions if desired
        // if (sessionToDelete) {
        //     console.log(`Deleting session ${sessionToDelete} for disconnected player.`);
        //     playerSessions.delete(sessionToDelete);
        // }
    });
});

// Generate a random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
