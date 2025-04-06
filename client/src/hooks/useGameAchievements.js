import { useState, useCallback, useEffect } from "react";
import { useGameStats } from "./useGameStats";
import { useNotifications } from "./useNotifications";

const ACHIEVEMENTS = {
    FIRST_GAME: {
        id: "first_game",
        title: "First Game",
        description: "Play your first game",
        icon: "🎮",
        condition: (stats) => stats.gamesPlayed >= 1,
    },
    WORD_MASTER: {
        id: "word_master",
        title: "Word Master",
        description: "Guess 100 words correctly",
        icon: "📚",
        condition: (stats) => stats.wordsGuessed >= 100,
    },
    HIGH_SCORER: {
        id: "high_scorer",
        title: "High Scorer",
        description: "Score 1000 points in a single game",
        icon: "🏆",
        condition: (stats) => stats.highestScore >= 1000,
    },
    TEAM_PLAYER: {
        id: "team_player",
        title: "Team Player",
        description: "Win 10 games with your team",
        icon: "👥",
        condition: (stats) => Object.values(stats.teamStats).some((team) => team.gamesWon >= 10),
    },
    QUICK_THINKER: {
        id: "quick_thinker",
        title: "Quick Thinker",
        description: "Guess 5 words in under 30 seconds",
        icon: "⚡",
        condition: (stats) => stats.wordsGuessed >= 5 && stats.timePlayed <= 30000,
    },
    CONSISTENT: {
        id: "consistent",
        title: "Consistent",
        description: "Play 10 games",
        icon: "🎯",
        condition: (stats) => stats.gamesPlayed >= 10,
    },
    WINNING_STREAK: {
        id: "winning_streak",
        title: "Winning Streak",
        description: "Win 3 games in a row",
        icon: "🔥",
        condition: (stats) => {
            const recentGames = stats.recentGames.slice(0, 3);
            return recentGames.length === 3 && recentGames.every((game) => game.score > 0);
        },
    },
    WORD_SUBMITTER: {
        id: "word_submitter",
        title: "Word Submitter",
        description: "Submit 50 words",
        icon: "✍️",
        condition: (stats) => stats.wordsSubmitted >= 50,
    },
};

export function useGameAchievements() {
    const { stats } = useGameStats();
    const { showNotification } = useNotifications();
    const [achievements, setAchievements] = useState(() => {
        const savedAchievements = localStorage.getItem("gameAchievements");
        return savedAchievements ? JSON.parse(savedAchievements) : {};
    });

    useEffect(() => {
        localStorage.setItem("gameAchievements", JSON.stringify(achievements));
    }, [achievements]);

    const checkAchievements = useCallback(() => {
        const newAchievements = { ...achievements };
        let hasNewAchievements = false;

        Object.values(ACHIEVEMENTS).forEach((achievement) => {
            if (!newAchievements[achievement.id] && achievement.condition(stats)) {
                newAchievements[achievement.id] = {
                    ...achievement,
                    unlockedAt: new Date().toISOString(),
                };
                hasNewAchievements = true;

                showNotification({
                    title: "Achievement Unlocked!",
                    message: `${achievement.title}: ${achievement.description}`,
                    variant: "success",
                    icon: achievement.icon,
                });
            }
        });

        if (hasNewAchievements) {
            setAchievements(newAchievements);
        }
    }, [stats, achievements, showNotification]);

    useEffect(() => {
        checkAchievements();
    }, [checkAchievements]);

    const getAchievementProgress = useCallback(
        (achievementId) => {
            const achievement = ACHIEVEMENTS[achievementId];
            if (!achievement) return null;

            if (achievements[achievementId]) {
                return {
                    ...achievement,
                    unlocked: true,
                    unlockedAt: achievements[achievementId].unlockedAt,
                };
            }

            // Calculate progress based on achievement type
            let progress = 0;
            let total = 0;

            switch (achievementId) {
                case "word_master":
                    progress = stats.wordsGuessed;
                    total = 100;
                    break;
                case "team_player":
                    progress = Math.max(...Object.values(stats.teamStats).map((team) => team.gamesWon));
                    total = 10;
                    break;
                case "consistent":
                    progress = stats.gamesPlayed;
                    total = 10;
                    break;
                case "word_submitter":
                    progress = stats.wordsSubmitted;
                    total = 50;
                    break;
                default:
                    return {
                        ...achievement,
                        unlocked: false,
                    };
            }

            return {
                ...achievement,
                unlocked: false,
                progress,
                total,
                percentage: Math.min(100, Math.round((progress / total) * 100)),
            };
        },
        [stats, achievements]
    );

    const getAllAchievements = useCallback(() => {
        return Object.keys(ACHIEVEMENTS).map((id) => getAchievementProgress(id));
    }, [getAchievementProgress]);

    return {
        achievements,
        getAchievementProgress,
        getAllAchievements,
    };
}
