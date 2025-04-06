// Room model for the game

// Constants
const TURN_DURATION_MS = 30000; // 30 seconds per turn
const REQUIRED_WORDS_PER_PLAYER = 5; // 5 words per player

// Initialize a new room
function initializeRoom(name) {
    return {
        name,
        players: [],
        gameState: "waiting",
        teams: {
            "Team 1": [],
            "Team 2": [],
        },
        allWords: [],
        hat: [],
        currentRound: 0,
        rounds: [],
        teamScores: {
            "Team 1": { total: 0, roundScores: [0, 0, 0] },
            "Team 2": { total: 0, roundScores: [0, 0, 0] },
        },
        activeTeam: null,
        activePlayer: null,
        turnActive: false,
        turnTimer: null,
        currentWord: null,
        guessedWordsThisTurn: [],
        teamPlayerIndex: { "Team 1": -1, "Team 2": -1 },
        allWordsSubmitted: false,
    };
}

// Add a player to a room
function addPlayerToRoom(room, playerId, playerName) {
    const newPlayer = {
        id: playerId,
        name: playerName,
        team: null,
        words: [],
        isConnected: true,
    };
    room.players.push(newPlayer);
    return newPlayer;
}

// Remove a player from a room
function removePlayerFromRoom(room, playerId) {
    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    if (player.team) {
        const teamIndex = room.teams[player.team].findIndex((p) => p.id === playerId);
        if (teamIndex !== -1) {
            room.teams[player.team].splice(teamIndex, 1);
        }
    }

    room.players.splice(playerIndex, 1);
}

module.exports = {
    TURN_DURATION_MS,
    REQUIRED_WORDS_PER_PLAYER,
    initializeRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
};
