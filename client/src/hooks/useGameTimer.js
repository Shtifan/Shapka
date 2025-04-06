import { useState, useEffect, useCallback, useRef } from "react";
import { useGameSettings } from "./useGameSettings";
import { useGameSounds } from "./useGameSounds";

export function useGameTimer({ initialTime, onTimeUp, onTick, onWarning, onCritical }) {
    const { settings } = useGameSettings();
    const { playTickSound, playCountdownSound } = useGameSounds();
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);
    const lastTickRef = useRef(Date.now());

    const startTimer = useCallback(() => {
        if (isRunning) return;
        setIsRunning(true);
        setIsPaused(false);
        lastTickRef.current = Date.now();
    }, [isRunning]);

    const pauseTimer = useCallback(() => {
        if (!isRunning || isPaused) return;
        setIsPaused(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, [isRunning, isPaused]);

    const resumeTimer = useCallback(() => {
        if (!isRunning || !isPaused) return;
        setIsPaused(false);
        lastTickRef.current = Date.now();
    }, [isRunning, isPaused]);

    const stopTimer = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        setTimeLeft(initialTime);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, [initialTime]);

    const resetTimer = useCallback(() => {
        stopTimer();
        setTimeLeft(initialTime);
    }, [initialTime, stopTimer]);

    const addTime = useCallback((seconds) => {
        setTimeLeft((prev) => Math.max(0, prev + seconds));
    }, []);

    const subtractTime = useCallback((seconds) => {
        setTimeLeft((prev) => Math.max(0, prev - seconds));
    }, []);

    useEffect(() => {
        if (!isRunning || isPaused) return;

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - lastTickRef.current) / 1000);
            lastTickRef.current = now;

            setTimeLeft((prev) => {
                const newTime = Math.max(0, prev - delta);

                // Handle time up
                if (newTime === 0) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    if (onTimeUp) {
                        onTimeUp();
                    }
                    return 0;
                }

                // Handle tick sound
                if (settings.sound.enabled) {
                    if (newTime <= 3) {
                        playCountdownSound();
                    } else if (newTime % 5 === 0) {
                        playTickSound();
                    }
                }

                // Handle warnings
                if (onWarning && newTime === 10) {
                    onWarning();
                }

                // Handle critical time
                if (onCritical && newTime === 5) {
                    onCritical();
                }

                // Handle regular tick
                if (onTick) {
                    onTick(newTime);
                }

                return newTime;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [
        isRunning,
        isPaused,
        settings.sound.enabled,
        playTickSound,
        playCountdownSound,
        onTimeUp,
        onTick,
        onWarning,
        onCritical,
    ]);

    const formatTime = useCallback((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }, []);

    return {
        timeLeft,
        isRunning,
        isPaused,
        formattedTime: formatTime(timeLeft),
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        addTime,
        subtractTime,
    };
}
