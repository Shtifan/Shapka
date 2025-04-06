import { io } from "socket.io-client";
import { SOCKET_EVENTS } from "../constants";

class SocketManager {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.pendingHandlers = new Map();
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    connect(url) {
        console.log("Attempting to connect to server at:", url);

        if (this.socket) {
            console.log("Existing socket found, disconnecting first");
            this.disconnect();
        }

        try {
            this.socket = io(url, {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxConnectionAttempts,
                reconnectionDelay: 1000,
                timeout: 10000,
                transports: ["websocket", "polling"],
                forceNew: true,
            });

            this.setupBaseHandlers();
            this.setupPendingHandlers();

            // Force a connection attempt
            if (!this.socket.connected) {
                console.log("Socket not connected, attempting to connect manually");
                this.socket.connect();
            }

            return this.socket;
        } catch (error) {
            console.error("Error creating socket connection:", error);
            throw error;
        }
    }

    disconnect() {
        if (this.socket) {
            console.log("Disconnecting socket");
            this.socket.disconnect();
            this.socket = null;
        }
    }

    setupBaseHandlers() {
        if (!this.socket) {
            console.error("Cannot setup handlers: socket is null");
            return;
        }

        this.socket.on("connect", () => {
            console.log("Socket connected successfully");
            this.connectionAttempts = 0;
            this.setupPendingHandlers();
        });

        this.socket.on("disconnect", (reason) => {
            console.log("Socket disconnected. Reason:", reason);
        });

        this.socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            this.connectionAttempts++;

            if (this.connectionAttempts >= this.maxConnectionAttempts) {
                console.error("Max connection attempts reached");
                this.disconnect();
            }
        });

        this.socket.on("error", (error) => {
            console.error("Socket error:", error);
        });

        this.socket.on("reconnect_attempt", (attemptNumber) => {
            console.log("Reconnection attempt:", attemptNumber);
        });

        this.socket.on("reconnect_failed", () => {
            console.error("Failed to reconnect after all attempts");
        });
    }

    setupPendingHandlers() {
        if (!this.socket) {
            console.log("Cannot setup pending handlers: socket is null");
            return;
        }

        console.log("Setting up pending handlers");
        this.pendingHandlers.forEach((handlers, event) => {
            handlers.forEach((handler) => {
                console.log("Registering pending handler for event:", event);
                this.socket.on(event, handler);
            });
        });
        this.pendingHandlers.clear();
    }

    on(event, handler) {
        console.log("Registering handler for event:", event);

        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);

        if (this.socket) {
            console.log("Socket exists, registering handler immediately");
            this.socket.on(event, handler);
        } else {
            console.log("Socket not connected, adding handler to pending queue");
            if (!this.pendingHandlers.has(event)) {
                this.pendingHandlers.set(event, new Set());
            }
            this.pendingHandlers.get(event).add(handler);
        }
    }

    off(event, handler) {
        console.log("Removing handler for event:", event);

        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
            if (this.socket) {
                this.socket.off(event, handler);
            }
            if (this.pendingHandlers.has(event)) {
                this.pendingHandlers.get(event).delete(handler);
            }
        }
    }

    emit(event, data) {
        if (this.socket) {
            console.log("Emitting event:", event, "with data:", data);
            this.socket.emit(event, data);
        } else {
            console.error("Cannot emit event: socket not connected");
        }
    }

    // Room methods
    joinRoom(roomName, playerName) {
        console.log("Joining room:", roomName, "as player:", playerName);
        this.emit(SOCKET_EVENTS.JOIN_ROOM, { roomName, playerName });
    }

    leaveRoom(roomName) {
        console.log("Leaving room:", roomName);
        this.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomName });
    }

    // Game methods
    startGame(roomName) {
        console.log("Starting game in room:", roomName);
        this.emit(SOCKET_EVENTS.START_GAME, { roomName });
    }

    submitWords(roomName, words) {
        console.log("Submitting words for room:", roomName);
        this.emit(SOCKET_EVENTS.SUBMIT_WORDS, { roomName, words });
    }

    // Turn methods
    startTurn(roomName) {
        console.log("Starting turn in room:", roomName);
        this.emit(SOCKET_EVENTS.START_TURN, { roomName });
    }

    endTurn(roomName) {
        console.log("Ending turn in room:", roomName);
        this.emit(SOCKET_EVENTS.END_TURN, { roomName });
    }

    guessWord(roomName, word) {
        console.log("Guessing word in room:", roomName);
        this.emit(SOCKET_EVENTS.GUESS_WORD, { roomName, word });
    }

    // Round methods
    startRound(roomName) {
        console.log("Starting round in room:", roomName);
        this.emit(SOCKET_EVENTS.START_ROUND, { roomName });
    }

    endRound(roomName) {
        console.log("Ending round in room:", roomName);
        this.emit(SOCKET_EVENTS.END_ROUND, { roomName });
    }

    // Game end methods
    endGame(roomName) {
        console.log("Ending game in room:", roomName);
        this.emit(SOCKET_EVENTS.END_GAME, { roomName });
    }
}

// Create a singleton instance
const socketManager = new SocketManager();
export default socketManager;
