import { useCallback } from "react";
import confetti from "canvas-confetti";
import { useGameSettings } from "./useGameSettings";

export function useGameConfetti() {
    const { settings } = useGameSettings();

    const fireConfetti = useCallback(
        (options = {}) => {
            if (!settings.appearance.confetti) return;

            const defaults = {
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
                ticks: 200,
                gravity: 1,
                scalar: 1,
            };

            confetti({
                ...defaults,
                ...options,
            });
        },
        [settings.appearance.confetti]
    );

    const fireVictoryConfetti = useCallback(() => {
        fireConfetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#ffd700", "#ffa500", "#ff4500"],
            ticks: 300,
            gravity: 1.2,
            scalar: 1.2,
        });
    }, [fireConfetti]);

    const fireAchievementConfetti = useCallback(() => {
        fireConfetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#ffd700", "#ffa500"],
            ticks: 200,
            gravity: 1,
            scalar: 1,
        });
    }, [fireConfetti]);

    const fireRoundEndConfetti = useCallback(() => {
        fireConfetti({
            particleCount: 75,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#ff0000", "#00ff00", "#0000ff"],
            ticks: 250,
            gravity: 1.1,
            scalar: 1.1,
        });
    }, [fireConfetti]);

    const fireGameEndConfetti = useCallback(() => {
        // Fire multiple bursts for a more dramatic effect
        const end = Date.now() + 1000;

        const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

        (function frame() {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }, [fireConfetti]);

    const fireTeamConfetti = useCallback(
        (team) => {
            const teamColors = {
                red: ["#ff0000", "#ff4444", "#ff8888"],
                blue: ["#0000ff", "#4444ff", "#8888ff"],
            };

            fireConfetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: teamColors[team] || teamColors.red,
                ticks: 250,
                gravity: 1.1,
                scalar: 1.1,
            });
        },
        [fireConfetti]
    );

    return {
        fireConfetti,
        fireVictoryConfetti,
        fireAchievementConfetti,
        fireRoundEndConfetti,
        fireGameEndConfetti,
        fireTeamConfetti,
    };
}
