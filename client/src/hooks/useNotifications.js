import { useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useSoundEffects } from "./useSoundEffects";

export function useNotifications() {
    const { enqueueSnackbar } = useSnackbar();
    const { playCorrect, playWrong } = useSoundEffects();
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback(
        (message, options = {}) => {
            const { variant = "default", autoHideDuration = 3000, playSound = false, ...rest } = options;

            // Play sound based on variant
            if (playSound) {
                switch (variant) {
                    case "success":
                        playCorrect();
                        break;
                    case "error":
                        playWrong();
                        break;
                    default:
                        break;
                }
            }

            // Show notification
            const id = Date.now();
            const notification = {
                id,
                message,
                variant,
                timestamp: new Date(),
                ...rest,
            };

            setNotifications((prev) => [notification, ...prev].slice(0, 5));

            // Show snackbar
            enqueueSnackbar(message, {
                variant,
                autoHideDuration,
                ...rest,
            });

            return id;
        },
        [enqueueSnackbar, playCorrect, playWrong]
    );

    const showSuccess = useCallback(
        (message, options = {}) => {
            return showNotification(message, { ...options, variant: "success" });
        },
        [showNotification]
    );

    const showError = useCallback(
        (message, options = {}) => {
            return showNotification(message, { ...options, variant: "error" });
        },
        [showNotification]
    );

    const showInfo = useCallback(
        (message, options = {}) => {
            return showNotification(message, { ...options, variant: "info" });
        },
        [showNotification]
    );

    const showWarning = useCallback(
        (message, options = {}) => {
            return showNotification(message, { ...options, variant: "warning" });
        },
        [showNotification]
    );

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        clearNotifications,
    };
}
