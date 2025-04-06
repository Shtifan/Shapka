import { useState, useEffect, useCallback } from "react";
import { SOCKET_EVENTS } from "../constants";
import socketManager from "../utils/socket";

export function useGamePlay(roomName) {
    const [currentWord, setCurrentWord] = useState("");
    const [timer, setTimer] = useState(0);
    const [isGuessing, setIsGuessing] = useState(false);
    const [roundScore, setRoundScore] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleTurnStart = (data) => {
            setCurrentWord(data.word);
            setTimer(data.duration);
            setIsGuessing(true);
            setError(null);
        };

        const handleTurnEnd = (data) => {
            setCurrentWord("");
            setTimer(0);
            setIsGuessing(false);
            setRoundScore(data.roundScore);
        };

        const handleWordGuessed = (data) => {
            setRoundScore(data.roundScore);
            if (data.isCorrect) {
                setCurrentWord("");
                setIsGuessing(false);
            }
        };

        const handleError = (error) => {
            setError(error);
        };

        socketManager.on(SOCKET_EVENTS.TURN_START, handleTurnStart);
        socketManager.on(SOCKET_EVENTS.TURN_END, handleTurnEnd);
        socketManager.on(SOCKET_EVENTS.WORD_GUESSED, handleWordGuessed);
        socketManager.on(SOCKET_EVENTS.ERROR, handleError);

        return () => {
            socketManager.off(SOCKET_EVENTS.TURN_START, handleTurnStart);
            socketManager.off(SOCKET_EVENTS.TURN_END, handleTurnEnd);
            socketManager.off(SOCKET_EVENTS.WORD_GUESSED, handleWordGuessed);
            socketManager.off(SOCKET_EVENTS.ERROR, handleError);
        };
    }, []);

    const startTurn = useCallback(() => {
        socketManager.startTurn(roomName);
        setError(null);
    }, [roomName]);

    const endTurn = useCallback(() => {
        socketManager.endTurn(roomName);
        setError(null);
    }, [roomName]);

    const guessWord = useCallback(
        (word) => {
            if (!isGuessing) {
                return;
            }
            socketManager.guessWord(roomName, word);
            setError(null);
        },
        [roomName, isGuessing]
    );

    const skipWord = useCallback(() => {
        if (!isGuessing) {
            return;
        }
        endTurn();
    }, [endTurn, isGuessing]);

    return {
        currentWord,
        timer,
        isGuessing,
        roundScore,
        error,
        startTurn,
        endTurn,
        guessWord,
        skipWord,
    };
}
