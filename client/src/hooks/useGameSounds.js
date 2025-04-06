import { useState, useCallback, useEffect } from "react";
import { useGameSettings } from "./useGameSettings";

const SOUND_EFFECTS = {
    CORRECT: "/sounds/correct.mp3",
    WRONG: "/sounds/wrong.mp3",
    TICK: "/sounds/tick.mp3",
    COUNTDOWN: "/sounds/countdown.mp3",
    GAME_START: "/sounds/game-start.mp3",
    GAME_END: "/sounds/game-end.mp3",
    ROUND_START: "/sounds/round-start.mp3",
    ROUND_END: "/sounds/round-end.mp3",
    TURN_START: "/sounds/turn-start.mp3",
    TURN_END: "/sounds/turn-end.mp3",
    WORD_SUBMIT: "/sounds/word-submit.mp3",
    PLAYER_JOIN: "/sounds/player-join.mp3",
    PLAYER_LEAVE: "/sounds/player-leave.mp3",
    ACHIEVEMENT: "/sounds/achievement.mp3",
    ERROR: "/sounds/error.mp3",
    SUCCESS: "/sounds/success.mp3",
    CLICK: "/sounds/click.mp3",
    HOVER: "/sounds/hover.mp3",
};

export function useGameSounds() {
    const { settings } = useGameSettings();
    const [audioElements, setAudioElements] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Preload all sound effects
        const loadSounds = async () => {
            const elements = {};
            let loadedCount = 0;
            const totalSounds = Object.keys(SOUND_EFFECTS).length;

            for (const [key, path] of Object.entries(SOUND_EFFECTS)) {
                const audio = new Audio(path);
                audio.preload = "auto";

                audio.addEventListener("canplaythrough", () => {
                    loadedCount++;
                    if (loadedCount === totalSounds) {
                        setIsLoading(false);
                    }
                });

                elements[key] = audio;
            }

            setAudioElements(elements);
        };

        loadSounds();

        // Cleanup
        return () => {
            Object.values(audioElements).forEach((audio) => {
                audio.pause();
                audio.src = "";
            });
        };
    }, []);

    const playSound = useCallback(
        (soundKey, options = {}) => {
            if (!settings.sound.enabled || isLoading) return;

            const audio = audioElements[soundKey];
            if (!audio) {
                console.warn(`Sound effect not found: ${soundKey}`);
                return;
            }

            // Clone the audio element to allow overlapping sounds
            const sound = audio.cloneNode();
            sound.volume = options.volume || settings.sound.volume;

            if (options.loop) {
                sound.loop = true;
            }

            if (options.playbackRate) {
                sound.playbackRate = options.playbackRate;
            }

            sound.play().catch((error) => {
                console.warn("Failed to play sound:", error);
            });

            return sound;
        },
        [audioElements, settings.sound, isLoading]
    );

    const stopSound = useCallback((sound) => {
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }, []);

    const playCorrectSound = useCallback(() => {
        return playSound("CORRECT", { volume: 0.7 });
    }, [playSound]);

    const playWrongSound = useCallback(() => {
        return playSound("WRONG", { volume: 0.7 });
    }, [playSound]);

    const playTickSound = useCallback(() => {
        return playSound("TICK", { volume: 0.3 });
    }, [playSound]);

    const playCountdownSound = useCallback(() => {
        return playSound("COUNTDOWN", { volume: 0.5 });
    }, [playSound]);

    const playGameStartSound = useCallback(() => {
        return playSound("GAME_START", { volume: 0.8 });
    }, [playSound]);

    const playGameEndSound = useCallback(() => {
        return playSound("GAME_END", { volume: 0.8 });
    }, [playSound]);

    const playRoundStartSound = useCallback(() => {
        return playSound("ROUND_START", { volume: 0.7 });
    }, [playSound]);

    const playRoundEndSound = useCallback(() => {
        return playSound("ROUND_END", { volume: 0.7 });
    }, [playSound]);

    const playTurnStartSound = useCallback(() => {
        return playSound("TURN_START", { volume: 0.6 });
    }, [playSound]);

    const playTurnEndSound = useCallback(() => {
        return playSound("TURN_END", { volume: 0.6 });
    }, [playSound]);

    const playWordSubmitSound = useCallback(() => {
        return playSound("WORD_SUBMIT", { volume: 0.5 });
    }, [playSound]);

    const playPlayerJoinSound = useCallback(() => {
        return playSound("PLAYER_JOIN", { volume: 0.4 });
    }, [playSound]);

    const playPlayerLeaveSound = useCallback(() => {
        return playSound("PLAYER_LEAVE", { volume: 0.4 });
    }, [playSound]);

    const playAchievementSound = useCallback(() => {
        return playSound("ACHIEVEMENT", { volume: 0.8 });
    }, [playSound]);

    const playErrorSound = useCallback(() => {
        return playSound("ERROR", { volume: 0.6 });
    }, [playSound]);

    const playSuccessSound = useCallback(() => {
        return playSound("SUCCESS", { volume: 0.6 });
    }, [playSound]);

    const playClickSound = useCallback(() => {
        return playSound("CLICK", { volume: 0.3 });
    }, [playSound]);

    const playHoverSound = useCallback(() => {
        return playSound("HOVER", { volume: 0.2 });
    }, [playSound]);

    return {
        isLoading,
        playSound,
        stopSound,
        playCorrectSound,
        playWrongSound,
        playTickSound,
        playCountdownSound,
        playGameStartSound,
        playGameEndSound,
        playRoundStartSound,
        playRoundEndSound,
        playTurnStartSound,
        playTurnEndSound,
        playWordSubmitSound,
        playPlayerJoinSound,
        playPlayerLeaveSound,
        playAchievementSound,
        playErrorSound,
        playSuccessSound,
        playClickSound,
        playHoverSound,
    };
}
