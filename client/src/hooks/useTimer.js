import { useState, useEffect, useCallback } from "react";

export function useTimer(initialTime = 0, onTimeUp = () => {}) {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let timer;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1000) {
                        clearInterval(timer);
                        setIsRunning(false);
                        onTimeUp();
                        return 0;
                    }
                    return prevTime - 1000;
                });
            }, 1000);
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isRunning, timeLeft, onTimeUp]);

    const start = useCallback((duration) => {
        setTimeLeft(duration);
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const resume = useCallback(() => {
        if (timeLeft > 0) {
            setIsRunning(true);
        }
    }, [timeLeft]);

    const stop = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(0);
    }, []);

    const reset = useCallback(
        (duration = initialTime) => {
            setIsRunning(false);
            setTimeLeft(duration);
        },
        [initialTime]
    );

    return {
        timeLeft,
        isRunning,
        start,
        pause,
        resume,
        stop,
        reset,
    };
}
