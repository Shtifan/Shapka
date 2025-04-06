import { useCallback } from "react";

// Sound URLs - replace these with your actual sound files
const SOUNDS = {
    CORRECT: "/sounds/correct.mp3",
    WRONG: "/sounds/wrong.mp3",
    TIMER: "/sounds/timer.mp3",
    GAME_START: "/sounds/game-start.mp3",
    ROUND_START: "/sounds/round-start.mp3",
    ROUND_END: "/sounds/round-end.mp3",
    GAME_END: "/sounds/game-end.mp3",
    BUTTON_CLICK: "/sounds/button-click.mp3",
};

export function useSoundEffects() {
    const playSound = useCallback((soundName) => {
        if (!SOUNDS[soundName]) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }

        try {
            const audio = new Audio(SOUNDS[soundName]);
            audio.volume = 0.5; // Set volume to 50%
            audio.play().catch((error) => {
                console.warn("Failed to play sound:", error);
            });
        } catch (error) {
            console.warn("Error creating Audio object:", error);
        }
    }, []);

    const playCorrect = useCallback(() => {
        playSound("CORRECT");
    }, [playSound]);

    const playWrong = useCallback(() => {
        playSound("WRONG");
    }, [playSound]);

    const playTimer = useCallback(() => {
        playSound("TIMER");
    }, [playSound]);

    const playGameStart = useCallback(() => {
        playSound("GAME_START");
    }, [playSound]);

    const playRoundStart = useCallback(() => {
        playSound("ROUND_START");
    }, [playSound]);

    const playRoundEnd = useCallback(() => {
        playSound("ROUND_END");
    }, [playSound]);

    const playGameEnd = useCallback(() => {
        playSound("GAME_END");
    }, [playSound]);

    const playButtonClick = useCallback(() => {
        playSound("BUTTON_CLICK");
    }, [playSound]);

    return {
        playCorrect,
        playWrong,
        playTimer,
        playGameStart,
        playRoundStart,
        playRoundEnd,
        playGameEnd,
        playButtonClick,
    };
}
