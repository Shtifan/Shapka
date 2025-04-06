import { useState, useCallback, useEffect } from "react";

const DEFAULT_SETTINGS = {
    sound: {
        enabled: true,
        volume: 0.5,
        musicVolume: 0.3,
    },
    notifications: {
        enabled: true,
        position: "bottom-right",
        duration: 3000,
    },
    appearance: {
        theme: "dark",
        fontSize: "medium",
        animations: true,
        confetti: true,
    },
    gameplay: {
        turnDuration: 60,
        roundsPerGame: 3,
        wordsPerPlayer: 5,
        minPlayers: 4,
        maxPlayers: 8,
        language: "en",
        difficulty: "medium",
    },
    accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
    },
};

export function useGameSettings() {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem("gameSettings");
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem("gameSettings", JSON.stringify(settings));
    }, [settings]);

    const updateSettings = useCallback((newSettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            ...newSettings,
        }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    const updateSoundSettings = useCallback((soundSettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            sound: {
                ...prevSettings.sound,
                ...soundSettings,
            },
        }));
    }, []);

    const updateNotificationSettings = useCallback((notificationSettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            notifications: {
                ...prevSettings.notifications,
                ...notificationSettings,
            },
        }));
    }, []);

    const updateAppearanceSettings = useCallback((appearanceSettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            appearance: {
                ...prevSettings.appearance,
                ...appearanceSettings,
            },
        }));
    }, []);

    const updateGameplaySettings = useCallback((gameplaySettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            gameplay: {
                ...prevSettings.gameplay,
                ...gameplaySettings,
            },
        }));
    }, []);

    const updateAccessibilitySettings = useCallback((accessibilitySettings) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            accessibility: {
                ...prevSettings.accessibility,
                ...accessibilitySettings,
            },
        }));
    }, []);

    const toggleSound = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            sound: {
                ...prevSettings.sound,
                enabled: !prevSettings.sound.enabled,
            },
        }));
    }, []);

    const toggleNotifications = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            notifications: {
                ...prevSettings.notifications,
                enabled: !prevSettings.notifications.enabled,
            },
        }));
    }, []);

    const toggleTheme = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            appearance: {
                ...prevSettings.appearance,
                theme: prevSettings.appearance.theme === "dark" ? "light" : "dark",
            },
        }));
    }, []);

    const toggleAnimations = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            appearance: {
                ...prevSettings.appearance,
                animations: !prevSettings.appearance.animations,
            },
        }));
    }, []);

    const toggleConfetti = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            appearance: {
                ...prevSettings.appearance,
                confetti: !prevSettings.appearance.confetti,
            },
        }));
    }, []);

    const toggleHighContrast = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            accessibility: {
                ...prevSettings.accessibility,
                highContrast: !prevSettings.accessibility.highContrast,
            },
        }));
    }, []);

    const toggleReducedMotion = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            accessibility: {
                ...prevSettings.accessibility,
                reducedMotion: !prevSettings.accessibility.reducedMotion,
            },
        }));
    }, []);

    const toggleScreenReader = useCallback(() => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            accessibility: {
                ...prevSettings.accessibility,
                screenReader: !prevSettings.accessibility.screenReader,
            },
        }));
    }, []);

    return {
        settings,
        updateSettings,
        resetSettings,
        updateSoundSettings,
        updateNotificationSettings,
        updateAppearanceSettings,
        updateGameplaySettings,
        updateAccessibilitySettings,
        toggleSound,
        toggleNotifications,
        toggleTheme,
        toggleAnimations,
        toggleConfetti,
        toggleHighContrast,
        toggleReducedMotion,
        toggleScreenReader,
    };
}
