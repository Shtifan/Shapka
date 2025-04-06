// Game constants
export const REQUIRED_WORDS_PER_PLAYER = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const DEFAULT_TURN_DURATION = 60; // seconds

// Server URL
export const SERVER_URL = "http://localhost:3001";

// Socket event names
export const SOCKET_EVENTS = {
    // Connection events
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    ERROR: "error",

    // Room events
    JOIN_ROOM: "joinRoom",
    ROOM_JOINED: "roomJoined",
    LEAVE_ROOM: "leaveRoom",
    PLAYER_JOINED: "playerJoined",
    PLAYER_LEFT: "playerLeft",

    // Game events
    START_GAME: "startGame",
    GAME_STARTED: "gameStarted",
    GAME_STATE_UPDATE: "gameStateUpdate",
    SUBMIT_WORDS: "submitWords",
    ALL_WORDS_SUBMITTED: "allWordsSubmitted",

    // Turn events
    START_TURN: "startTurn",
    TURN_START: "turnStart",
    END_TURN: "endTurn",
    TURN_END: "turnEnd",
    GUESS_WORD: "guessWord",
    WORD_GUESSED: "wordGuessed",

    // Round events
    START_ROUND: "startRound",
    ROUND_STARTED: "roundStarted",
    END_ROUND: "endRound",
    ROUND_ENDED: "roundEnded",

    // Game end events
    END_GAME: "endGame",
    GAME_ENDED: "gameEnded",
};
