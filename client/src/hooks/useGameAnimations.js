import { useState, useCallback } from "react";
import { useGameSettings } from "./useGameSettings";

export function useGameAnimations() {
    const { settings } = useGameSettings();
    const [animations, setAnimations] = useState({
        wordReveal: false,
        scoreUpdate: false,
        teamChange: false,
        playerJoin: false,
        playerLeave: false,
        roundStart: false,
        roundEnd: false,
        gameStart: false,
        gameEnd: false,
    });

    const triggerAnimation = useCallback(
        (animationName, duration = 1000) => {
            if (!settings.animationsEnabled) return;

            setAnimations((prev) => ({
                ...prev,
                [animationName]: true,
            }));

            setTimeout(() => {
                setAnimations((prev) => ({
                    ...prev,
                    [animationName]: false,
                }));
            }, duration);
        },
        [settings.animationsEnabled]
    );

    const getAnimationClass = useCallback(
        (animationName) => {
            if (!settings.animationsEnabled) return "";

            const animationClasses = {
                wordReveal: "animate__animated animate__fadeIn",
                scoreUpdate: "animate__animated animate__bounceIn",
                teamChange: "animate__animated animate__flipInX",
                playerJoin: "animate__animated animate__slideInRight",
                playerLeave: "animate__animated animate__slideOutLeft",
                roundStart: "animate__animated animate__zoomIn",
                roundEnd: "animate__animated animate__zoomOut",
                gameStart: "animate__animated animate__fadeInDown",
                gameEnd: "animate__animated animate__fadeOutUp",
            };

            return animations[animationName] ? animationClasses[animationName] : "";
        },
        [animations, settings.animationsEnabled]
    );

    const triggerWordReveal = useCallback(() => {
        triggerAnimation("wordReveal", 800);
    }, [triggerAnimation]);

    const triggerScoreUpdate = useCallback(() => {
        triggerAnimation("scoreUpdate", 600);
    }, [triggerAnimation]);

    const triggerTeamChange = useCallback(() => {
        triggerAnimation("teamChange", 1000);
    }, [triggerAnimation]);

    const triggerPlayerJoin = useCallback(() => {
        triggerAnimation("playerJoin", 500);
    }, [triggerAnimation]);

    const triggerPlayerLeave = useCallback(() => {
        triggerAnimation("playerLeave", 500);
    }, [triggerAnimation]);

    const triggerRoundStart = useCallback(() => {
        triggerAnimation("roundStart", 1000);
    }, [triggerAnimation]);

    const triggerRoundEnd = useCallback(() => {
        triggerAnimation("roundEnd", 1000);
    }, [triggerAnimation]);

    const triggerGameStart = useCallback(() => {
        triggerAnimation("gameStart", 1500);
    }, [triggerAnimation]);

    const triggerGameEnd = useCallback(() => {
        triggerAnimation("gameEnd", 1500);
    }, [triggerAnimation]);

    return {
        animations,
        getAnimationClass,
        triggerWordReveal,
        triggerScoreUpdate,
        triggerTeamChange,
        triggerPlayerJoin,
        triggerPlayerLeave,
        triggerRoundStart,
        triggerRoundEnd,
        triggerGameStart,
        triggerGameEnd,
    };
}
