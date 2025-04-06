import { useCallback } from "react";
import { useSnackbar } from "notistack";
import { useGameSettings } from "./useGameSettings";
import { useGameSounds } from "./useGameSounds";

export function useGameNotifications() {
    const { settings } = useGameSettings();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { playSuccessSound, playErrorSound, playAchievementSound, playClickSound } = useGameSounds();

    const showNotification = useCallback(
        ({ message, title, variant = "default", icon, duration, action, onClose, onAction }) => {
            if (!settings.notifications.enabled) return;

            const options = {
                variant,
                autoHideDuration: duration || settings.notifications.duration,
                anchorOrigin: {
                    vertical: "bottom",
                    horizontal: settings.notifications.position.includes("right") ? "right" : "left",
                },
                action: action
                    ? (key) => (
                          <button
                              onClick={() => {
                                  if (onAction) onAction();
                                  closeSnackbar(key);
                              }}
                          >
                              {action}
                          </button>
                      )
                    : undefined,
                onClose: () => {
                    if (onClose) onClose();
                },
            };

            // Play appropriate sound based on notification type
            switch (variant) {
                case "success":
                    playSuccessSound();
                    break;
                case "error":
                    playErrorSound();
                    break;
                case "achievement":
                    playAchievementSound();
                    break;
                default:
                    playClickSound();
                    break;
            }

            enqueueSnackbar(
                <div>
                    {title && <strong>{title}</strong>}
                    {title && message && <br />}
                    {message}
                    {icon && <span style={{ marginLeft: "8px" }}>{icon}</span>}
                </div>,
                options
            );
        },
        [
            settings.notifications,
            enqueueSnackbar,
            closeSnackbar,
            playSuccessSound,
            playErrorSound,
            playAchievementSound,
            playClickSound,
        ]
    );

    const showSuccessNotification = useCallback(
        (message, options = {}) => {
            showNotification({
                message,
                variant: "success",
                icon: "✅",
                ...options,
            });
        },
        [showNotification]
    );

    const showErrorNotification = useCallback(
        (message, options = {}) => {
            showNotification({
                message,
                variant: "error",
                icon: "❌",
                ...options,
            });
        },
        [showNotification]
    );

    const showInfoNotification = useCallback(
        (message, options = {}) => {
            showNotification({
                message,
                variant: "info",
                icon: "ℹ️",
                ...options,
            });
        },
        [showNotification]
    );

    const showWarningNotification = useCallback(
        (message, options = {}) => {
            showNotification({
                message,
                variant: "warning",
                icon: "⚠️",
                ...options,
            });
        },
        [showNotification]
    );

    const showAchievementNotification = useCallback(
        (title, message, options = {}) => {
            showNotification({
                title,
                message,
                variant: "achievement",
                icon: "🏆",
                ...options,
            });
        },
        [showNotification]
    );

    const showGameStartNotification = useCallback(
        (options = {}) => {
            showNotification({
                title: "Game Started!",
                message: "Get ready to play!",
                variant: "success",
                icon: "🎮",
                ...options,
            });
        },
        [showNotification]
    );

    const showGameEndNotification = useCallback(
        (winner, options = {}) => {
            showNotification({
                title: "Game Over!",
                message: winner ? `${winner} team wins!` : "Game ended in a tie!",
                variant: "success",
                icon: "🎉",
                ...options,
            });
        },
        [showNotification]
    );

    const showRoundStartNotification = useCallback(
        (roundNumber, options = {}) => {
            showNotification({
                title: `Round ${roundNumber}`,
                message: "Let's begin!",
                variant: "info",
                icon: "🎯",
                ...options,
            });
        },
        [showNotification]
    );

    const showRoundEndNotification = useCallback(
        (roundNumber, options = {}) => {
            showNotification({
                title: `Round ${roundNumber} Complete`,
                message: "Great job everyone!",
                variant: "success",
                icon: "👏",
                ...options,
            });
        },
        [showNotification]
    );

    const showTurnStartNotification = useCallback(
        (playerName, options = {}) => {
            showNotification({
                title: "Your Turn!",
                message: `${playerName}, it's your turn to guess!`,
                variant: "info",
                icon: "⏰",
                ...options,
            });
        },
        [showNotification]
    );

    const showTurnEndNotification = useCallback(
        (playerName, score, options = {}) => {
            showNotification({
                title: "Turn Complete",
                message: `${playerName} scored ${score} points!`,
                variant: "success",
                icon: "✨",
                ...options,
            });
        },
        [showNotification]
    );

    return {
        showNotification,
        showSuccessNotification,
        showErrorNotification,
        showInfoNotification,
        showWarningNotification,
        showAchievementNotification,
        showGameStartNotification,
        showGameEndNotification,
        showRoundStartNotification,
        showRoundEndNotification,
        showTurnStartNotification,
        showTurnEndNotification,
    };
}
