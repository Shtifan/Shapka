// Team controller

const { log } = require("../utils/helpers");
const { emitGameState } = require("./gameStateController");

// Assign teams
function assignTeams(io, rooms, roomName) {
    const room = rooms.get(roomName);
    if (!room) return;

    // Get connected players
    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length < 2) {
        return io.to(roomName).emit("error", "Need at least 2 players to start");
    }

    // Shuffle players
    const shuffledPlayers = [...connectedPlayers].sort(() => Math.random() - 0.5);

    // Split into teams
    const teamSize = Math.ceil(shuffledPlayers.length / 2);
    const team1 = shuffledPlayers.slice(0, teamSize);
    const team2 = shuffledPlayers.slice(teamSize);

    // Assign teams
    team1.forEach((player) => {
        player.team = "team1";
    });
    team2.forEach((player) => {
        player.team = "team2";
    });

    // Initialize team scores
    room.teamScores = {
        team1: 0,
        team2: 0,
    };

    // Set active team
    room.activeTeam = "team1";
    room.teamPlayerIndex = 0;

    // Log team assignments
    log(
        "info",
        roomName,
        `Teams assigned:
        Team 1: ${team1.map((p) => p.name).join(", ")}
        Team 2: ${team2.map((p) => p.name).join(", ")}`
    );

    // Emit team assignments
    io.to(roomName).emit("teamsAssigned", {
        team1: team1.map((p) => ({ id: p.id, name: p.name })),
        team2: team2.map((p) => ({ id: p.id, name: p.name })),
    });

    // Emit updated game state
    emitGameState(io, rooms, roomName);
}

// Switch teams
function switchTeams(io, rooms, socket, { playerId, newTeam }) {
    const room = Array.from(rooms.values()).find((r) => r.players.some((p) => p.id === socket.id));
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // Validate team switch
    if (room.gameState !== "waiting") {
        return socket.emit("error", "Cannot switch teams during game");
    }

    if (newTeam !== "team1" && newTeam !== "team2") {
        return socket.emit("error", "Invalid team");
    }

    // Switch team
    player.team = newTeam;

    // Log team switch
    log("info", room.name, `Player ${player.name} switched to ${newTeam}`);

    // Emit team switch event
    io.to(room.name).emit("teamSwitched", {
        playerId: player.id,
        playerName: player.name,
        newTeam: newTeam,
    });

    // Emit updated game state
    emitGameState(io, rooms, room.name);
}

// Get team balance
function getTeamBalance(room) {
    const team1Count = room.players.filter((p) => p.team === "team1" && p.isConnected).length;
    const team2Count = room.players.filter((p) => p.team === "team2" && p.isConnected).length;
    return Math.abs(team1Count - team2Count);
}

module.exports = {
    assignTeams,
    switchTeams,
    getTeamBalance,
};
