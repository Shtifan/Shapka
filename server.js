// server.js - WHOLE FILE

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/lobby", (req, res) => res.sendFile(__dirname + "/public/lobby.html"));
app.get("/words", (req, res) => res.sendFile(__dirname + "/public/words.html"));
app.get("/round1", (req, res) => res.sendFile(__dirname + "/public/round1.html"));

const rooms = {};
let serverTimers = {};

io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("joinRoom", (roomId) => {
        if (socket.roomId) {
            socket.leave(socket.roomId);
        }
        socket.join(roomId);
        socket.roomId = roomId;
        if (!rooms[roomId]) {
            rooms[roomId] = { id: roomId, players: {}, teams: { teamA: [], teamB: [] }, state: "LOBBY" };
            console.log(`Room [${roomId}] created.`);
        }
        // Check if player already exists (for reloads), otherwise create new
        if (!rooms[roomId].players[socket.id]) {
            rooms[roomId].players[socket.id] = { id: socket.id, words: [], team: null };
        }
        console.log(`Player ${socket.id} joined room [${roomId}]`);
        // Handle which update to send based on room state
        if (rooms[roomId].state === "LOBBY") {
            io.to(roomId).emit("lobbyUpdate", rooms[roomId]);
        } else if (rooms[roomId].state === "WORD_SUBMISSION") {
            io.to(roomId).emit("wordSubmissionUpdate", rooms[roomId].players);
        }
    });

    socket.on("joinTeam", (teamId) => {
        const roomId = socket.roomId;
        if (!rooms[roomId] || rooms[roomId].state !== "LOBBY") return;
        const room = rooms[roomId];
        if (room.teams[teamId] && room.teams[teamId].length < 2) {
            Object.keys(room.teams).forEach((t) => {
                room.teams[t] = room.teams[t].filter((pId) => pId !== socket.id);
            });
            room.teams[teamId].push(socket.id);
            room.players[socket.id].team = teamId;
            console.log(`Player ${socket.id} joined team [${teamId}] in room [${roomId}]`);
            io.to(roomId).emit("lobbyUpdate", room);
            checkLobbyReady(roomId);
        }
    });

    socket.on("submitWords", (words) => {
        const roomId = socket.roomId;
        if (!rooms[roomId] || rooms[roomId].state !== "WORD_SUBMISSION") return;
        // ***** CHANGE HERE: Validating for 5 words *****
        if (Array.isArray(words) && words.length === 5) {
            rooms[roomId].players[socket.id].words = words;
            console.log(`Player ${socket.id} submitted words in room [${roomId}]`);
            io.to(roomId).emit("wordSubmissionUpdate", rooms[roomId].players);
            checkAllWordsSubmitted(roomId);
        }
    });

    socket.on("startTurn", () => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room || room.state !== "ROUND_1" || room.activePlayerId !== socket.id || room.turnInProgress) return;
        room.turnInProgress = true;
        room.turnEndTime = Date.now() + 60000;
        serverTimers[roomId] = setTimeout(() => endTurn(roomId), 60000);
        const newWord = getNewWord(roomId);
        io.to(roomId).emit("turnBegan", { currentWord: newWord, turnEndTime: room.turnEndTime });
    });

    socket.on("wordGuessed", () => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room || !room.turnInProgress) return;
        room.scores[room.activeTeam]++;
        room.guessedWords.push(room.currentWord);
        if (room.wordPool.length === 0) {
            endRound(roomId);
            return;
        }
        const newWord = getNewWord(roomId);
        io.to(roomId).emit("gameStateUpdate", {
            scores: room.scores,
            currentWord: newWord,
            wordsLeft: room.wordPool.length,
        });
    });

    socket.on("skipWord", () => {
        const roomId = socket.roomId;
        const room = rooms[roomId];
        if (!room || !room.turnInProgress) return;
        room.wordPool.push(room.currentWord);
        const newWord = getNewWord(roomId);
        io.to(roomId).emit("gameStateUpdate", { currentWord: newWord });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        const roomId = socket.roomId;
        if (rooms[roomId]) {
            if (rooms[roomId].state === "ROUND_1" && rooms[roomId].activePlayerId === socket.id) {
                endTurn(roomId);
            }
            delete rooms[roomId].players[socket.id];
            Object.keys(rooms[roomId].teams).forEach((t) => {
                rooms[roomId].teams[t] = rooms[roomId].teams[t].filter((pId) => pId !== socket.id);
            });
            if (Object.keys(rooms[roomId].players).length === 0) {
                console.log(`Room [${roomId}] is empty and has been closed.`);
                delete rooms[roomId];
            } else {
                io.to(roomId).emit("lobbyUpdate", rooms[roomId]);
                io.to(roomId).emit("playerLeft", socket.id);
            }
        }
    });
});

function checkLobbyReady(roomId) {
    const room = rooms[roomId];
    if (room.teams.teamA.length === 2 && room.teams.teamB.length === 2) {
        console.log(`Lobby full for room [${roomId}]. Moving to word submission.`);
        room.state = "WORD_SUBMISSION";
        io.to(roomId).emit("startWordSubmission");
    }
}

function checkAllWordsSubmitted(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const allPlayers = Object.values(room.players);
    // ***** CHANGE HERE: Checking for 5 words *****
    if (allPlayers.length === 4 && allPlayers.every((p) => p.words.length === 5)) {
        console.log(`All words submitted for room [${roomId}]. Initializing Round 1.`);
        initializeRound1(roomId);
    }
}

function initializeRound1(roomId) {
    const room = rooms[roomId];
    room.state = "ROUND_1";
    let allWords = [];
    Object.values(room.players).forEach((p) => {
        allWords = allWords.concat(p.words);
    });
    room.wordPool = allWords.sort(() => Math.random() - 0.5);
    room.guessedWords = [];
    room.currentWord = null;
    room.turnOrder = [room.teams.teamA[0], room.teams.teamB[0], room.teams.teamA[1], room.teams.teamB[1]];
    room.turnIndex = 0;
    room.activePlayerId = room.turnOrder[room.turnIndex];
    room.activeTeam = room.players[room.activePlayerId].team;
    room.scores = { teamA: 0, teamB: 0 };
    room.turnInProgress = false;
    io.to(roomId).emit("startRound1", room);
}

function getNewWord(roomId) {
    const room = rooms[roomId];
    if (room.wordPool.length > 0) {
        room.currentWord = room.wordPool.shift();
        return room.currentWord;
    }
    return null;
}

function endTurn(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    console.log(`Turn ended for room [${roomId}]`);
    clearTimeout(serverTimers[roomId]);
    room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
    room.activePlayerId = room.turnOrder[room.turnIndex];
    room.activeTeam = room.players[room.activePlayerId].team;
    room.turnInProgress = false;
    room.currentWord = null;
    io.to(roomId).emit("turnEnded", {
        activePlayerId: room.activePlayerId,
        activeTeam: room.activeTeam,
        scores: room.scores,
    });
}

function endRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    console.log(`Round 1 ended for room [${roomId}]`);
    clearTimeout(serverTimers[roomId]);
    room.state = "ROUND_1_OVER";
    const winner =
        room.scores.teamA > room.scores.teamB ? "Team A" : room.scores.teamB > room.scores.teamA ? "Team B" : "It's a Tie";
    io.to(roomId).emit("roundEnded", { scores: room.scores, winner: winner });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running and listening on http://localhost:${PORT}`);
});
