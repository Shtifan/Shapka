import { useEffect, useCallback } from "react";
import { useGameSettings } from "./useGameSettings";
import { useGameSounds } from "./useGameSounds";

const DEFAULT_SHORTCUTS = {
    SUBMIT_WORD: "Enter",
    SKIP_TURN: "Space",
    END_TURN: "Escape",
    TOGGLE_MUTE: "M",
    TOGGLE_THEME: "T",
    TOGGLE_FULLSCREEN: "F",
    SHOW_HELP: "H",
    SHOW_SETTINGS: "S",
    SHOW_STATS: "P",
    SHOW_ACHIEVEMENTS: "A",
    QUIT_GAME: "Q",
};

export function useGameKeyboardShortcuts({
    onSubmitWord,
    onSkipTurn,
    onEndTurn,
    onToggleMute,
    onToggleTheme,
    onToggleFullscreen,
    onShowHelp,
    onShowSettings,
    onShowStats,
    onShowAchievements,
    onQuitGame,
}) {
    const { settings } = useGameSettings();
    const { playClickSound } = useGameSounds();

    const handleKeyPress = useCallback(
        (event) => {
            // Ignore keyboard shortcuts if user is typing in an input field
            if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
                return;
            }

            const key = event.key.toUpperCase();

            switch (key) {
                case DEFAULT_SHORTCUTS.SUBMIT_WORD:
                    if (onSubmitWord) {
                        playClickSound();
                        onSubmitWord();
                    }
                    break;

                case DEFAULT_SHORTCUTS.SKIP_TURN:
                    if (onSkipTurn) {
                        playClickSound();
                        onSkipTurn();
                    }
                    break;

                case DEFAULT_SHORTCUTS.END_TURN:
                    if (onEndTurn) {
                        playClickSound();
                        onEndTurn();
                    }
                    break;

                case DEFAULT_SHORTCUTS.TOGGLE_MUTE:
                    if (onToggleMute) {
                        playClickSound();
                        onToggleMute();
                    }
                    break;

                case DEFAULT_SHORTCUTS.TOGGLE_THEME:
                    if (onToggleTheme) {
                        playClickSound();
                        onToggleTheme();
                    }
                    break;

                case DEFAULT_SHORTCUTS.TOGGLE_FULLSCREEN:
                    if (onToggleFullscreen) {
                        playClickSound();
                        onToggleFullscreen();
                    }
                    break;

                case DEFAULT_SHORTCUTS.SHOW_HELP:
                    if (onShowHelp) {
                        playClickSound();
                        onShowHelp();
                    }
                    break;

                case DEFAULT_SHORTCUTS.SHOW_SETTINGS:
                    if (onShowSettings) {
                        playClickSound();
                        onShowSettings();
                    }
                    break;

                case DEFAULT_SHORTCUTS.SHOW_STATS:
                    if (onShowStats) {
                        playClickSound();
                        onShowStats();
                    }
                    break;

                case DEFAULT_SHORTCUTS.SHOW_ACHIEVEMENTS:
                    if (onShowAchievements) {
                        playClickSound();
                        onShowAchievements();
                    }
                    break;

                case DEFAULT_SHORTCUTS.QUIT_GAME:
                    if (onQuitGame) {
                        playClickSound();
                        onQuitGame();
                    }
                    break;

                default:
                    break;
            }
        },
        [
            onSubmitWord,
            onSkipTurn,
            onEndTurn,
            onToggleMute,
            onToggleTheme,
            onToggleFullscreen,
            onShowHelp,
            onShowSettings,
            onShowStats,
            onShowAchievements,
            onQuitGame,
            playClickSound,
        ]
    );

    useEffect(() => {
        if (settings.accessibility.reducedMotion) {
            return;
        }

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress, settings.accessibility.reducedMotion]);

    return {
        shortcuts: DEFAULT_SHORTCUTS,
    };
}
