import { useState, useCallback, useEffect } from "react";

const DEFAULT_STATS = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    highestScore: 0,
    averageScore: 0,
    wordsGuessed: 0,
    wordsSubmitted: 0,
    timePlayed: 0,
    teamStats: {
        red: { gamesWon: 0, totalScore: 0 },
        blue: { gamesWon: 0, totalScore: 0 },
    },
    recentGames: [],
};

export function useGameStats() {
    const [stats, setStats] = useState(() => {
        const savedStats = localStorage.getItem("gameStats");
        return savedStats ? JSON.parse(savedStats) : DEFAULT_STATS;
    });

    useEffect(() => {
        localStorage.setItem("gameStats", JSON.stringify(stats));
    }, [stats]);

    const updateGameStats = useCallback((gameData) => {
        setStats((prevStats) => {
            const newStats = { ...prevStats };

            // Update basic stats
            newStats.gamesPlayed += 1;
            newStats.totalScore += gameData.score;
            newStats.highestScore = Math.max(newStats.highestScore, gameData.score);
            newStats.averageScore = newStats.totalScore / newStats.gamesPlayed;
            newStats.wordsGuessed += gameData.wordsGuessed;
            newStats.wordsSubmitted += gameData.wordsSubmitted;
            newStats.timePlayed += gameData.duration;

            // Update team stats
            if (gameData.winningTeam) {
                newStats.gamesWon += 1;
                newStats.teamStats[gameData.winningTeam].gamesWon += 1;
            }
            newStats.teamStats[gameData.team].totalScore += gameData.score;

            // Update recent games
            newStats.recentGames = [
                {
                    date: new Date().toISOString(),
                    score: gameData.score,
                    team: gameData.team,
                    wordsGuessed: gameData.wordsGuessed,
                    duration: gameData.duration,
                },
                ...newStats.recentGames.slice(0, 9), // Keep only last 10 games
            ];

            return newStats;
        });
    }, []);

    const resetStats = useCallback(() => {
        setStats(DEFAULT_STATS);
    }, []);

    const getTeamStats = useCallback(
        (team) => {
            return stats.teamStats[team] || { gamesWon: 0, totalScore: 0 };
        },
        [stats]
    );

    const getWinRate = useCallback(() => {
        return stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
    }, [stats]);

    const getAverageWordsPerGame = useCallback(() => {
        return stats.gamesPlayed > 0 ? stats.wordsGuessed / stats.gamesPlayed : 0;
    }, [stats]);

    const getAverageGameDuration = useCallback(() => {
        return stats.gamesPlayed > 0 ? stats.timePlayed / stats.gamesPlayed : 0;
    }, [stats]);

    const getRecentGames = useCallback(
        (limit = 10) => {
            return stats.recentGames.slice(0, limit);
        },
        [stats]
    );

    return {
        stats,
        updateGameStats,
        resetStats,
        getTeamStats,
        getWinRate,
        getAverageWordsPerGame,
        getAverageGameDuration,
        getRecentGames,
    };
}
