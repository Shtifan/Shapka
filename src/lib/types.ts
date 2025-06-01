export type Player = {
    id: string;
    name: string;
    teamId: string;
};

export type Team = {
    id: string;
    name: string;
    players: Player[];
    score: number;
};

export type Word = {
    id: string;
    text: string;
    playerId: string;
    used: boolean;
};

export type Room = {
    id: string;
    name: string;
    teams: Team[];
    words: Word[];
    round: number;
    currentTeamIndex: number;
    currentPlayerIndex: number;
    gameStarted: boolean;
    gameEnded: boolean;
    timer: number;
};

export type GameState = {
    room: Room | null;
    currentPlayer: Player | null;
    isPlaying: boolean;
    timeLeft: number;
    currentWord: Word | null;
};
