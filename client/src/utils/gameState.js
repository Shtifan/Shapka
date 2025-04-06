class GameStateManager {
    constructor() {
        this.state = {
            gameState: "waiting", // waiting, wordSubmission, playing, ended
            players: [],
            teams: {
                "Team 1": [],
                "Team 2": [],
                Unassigned: [],
            },
            currentRound: 0,
            currentTurn: null,
            submittedWords: {},
            scores: {
                "Team 1": 0,
                "Team 2": 0,
            },
            error: null,
        };

        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach((listener) => listener(this.state));
    }

    // Helper methods
    getPlayerById(playerId) {
        return this.state.players.find((player) => player.id === playerId);
    }

    getPlayersByTeam(teamName) {
        return this.state.teams[teamName] || [];
    }

    getUnassignedPlayers() {
        return this.state.teams["Unassigned"] || [];
    }

    getSubmittedWordsCount() {
        return Object.keys(this.state.submittedWords).length;
    }

    getTotalRequiredWords() {
        return this.state.players.length * 5; // 5 words per player
    }

    isGameInProgress() {
        return this.state.gameState === "playing";
    }

    isWordSubmissionPhase() {
        return this.state.gameState === "wordSubmission";
    }

    isGameEnded() {
        return this.state.gameState === "ended";
    }

    // Socket event handlers
    handleGameStateUpdate(gameState) {
        this.setState({ ...gameState, error: null });
    }

    handlePlayerJoined(player) {
        const players = [...this.state.players, player];
        this.setState({ players, error: null });
    }

    handlePlayerLeft(playerId) {
        const players = this.state.players.filter((p) => p.id !== playerId);
        const teams = { ...this.state.teams };

        // Remove player from their team
        Object.keys(teams).forEach((teamName) => {
            teams[teamName] = teams[teamName].filter((p) => p.id !== playerId);
        });

        // Remove player's submitted words
        const submittedWords = { ...this.state.submittedWords };
        delete submittedWords[playerId];

        this.setState({
            players,
            teams,
            submittedWords,
            error: null,
        });
    }

    handleError(error) {
        this.setState({ error });
    }
}

// Create a singleton instance
const gameStateManager = new GameStateManager();
export default gameStateManager;
