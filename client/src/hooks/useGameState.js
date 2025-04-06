import { useState, useEffect, useCallback } from "react";
import { SOCKET_EVENTS } from "../constants";
import socketManager from "../utils/socket";
import gameStateManager from "../utils/gameState";

export function useGameState(roomName) {
    const [gameState, setGameState] = useState(gameStateManager.getState());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleGameStateUpdate = (newState) => {
            setGameState(newState);
            setIsLoading(false);
        };

        const handleError = (error) => {
            gameStateManager.handleError(error);
            setIsLoading(false);
        };

        const unsubscribe = gameStateManager.subscribe(handleGameStateUpdate);

        socketManager.on(SOCKET_EVENTS.GAME_STATE_UPDATE, gameStateManager.handleGameStateUpdate);
        socketManager.on(SOCKET_EVENTS.PLAYER_JOINED, gameStateManager.handlePlayerJoined);
        socketManager.on(SOCKET_EVENTS.PLAYER_LEFT, gameStateManager.handlePlayerLeft);
        socketManager.on(SOCKET_EVENTS.ERROR, handleError);

        return () => {
            unsubscribe();
            socketManager.off(SOCKET_EVENTS.GAME_STATE_UPDATE, gameStateManager.handleGameStateUpdate);
            socketManager.off(SOCKET_EVENTS.PLAYER_JOINED, gameStateManager.handlePlayerJoined);
            socketManager.off(SOCKET_EVENTS.PLAYER_LEFT, gameStateManager.handlePlayerLeft);
            socketManager.off(SOCKET_EVENTS.ERROR, handleError);
        };
    }, []);

    const startGame = useCallback(() => {
        if (gameState.gameState !== "waiting") {
            return;
        }
        socketManager.startGame(roomName);
    }, [roomName, gameState.gameState]);

    const startRound = useCallback(() => {
        if (!gameState.isGameInProgress) {
            return;
        }
        socketManager.startRound(roomName);
    }, [roomName, gameState.isGameInProgress]);

    const endRound = useCallback(() => {
        if (!gameState.isGameInProgress) {
            return;
        }
        socketManager.endRound(roomName);
    }, [roomName, gameState.isGameInProgress]);

    const startTurn = useCallback(() => {
        if (!gameState.isGameInProgress) {
            return;
        }
        socketManager.startTurn(roomName);
    }, [roomName, gameState.isGameInProgress]);

    const endTurn = useCallback(() => {
        if (!gameState.isGameInProgress) {
            return;
        }
        socketManager.endTurn(roomName);
    }, [roomName, gameState.isGameInProgress]);

    const guessWord = useCallback(
        (word) => {
            if (!gameState.isGameInProgress) {
                return;
            }
            socketManager.guessWord(roomName, word);
        },
        [roomName, gameState.isGameInProgress]
    );

    const endGame = useCallback(() => {
        if (gameState.gameState === "ended") {
            return;
        }
        socketManager.endGame(roomName);
    }, [roomName, gameState.gameState]);

    return {
        gameState,
        isLoading,
        startGame,
        startRound,
        endRound,
        startTurn,
        endTurn,
        guessWord,
        endGame,
    };
}
