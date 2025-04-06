import { useEffect, useCallback } from "react";

export function useKeyboardShortcuts(shortcuts) {
    const handleKeyDown = useCallback(
        (event) => {
            // Don't trigger shortcuts if user is typing in an input or textarea
            if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
                return;
            }

            const shortcut = shortcuts.find((s) => {
                const matchesKey = s.key === event.key;
                const matchesCtrl = s.ctrl === event.ctrlKey;
                const matchesShift = s.shift === event.shiftKey;
                const matchesAlt = s.alt === event.altKey;
                return matchesKey && matchesCtrl && matchesShift && matchesAlt;
            });

            if (shortcut) {
                event.preventDefault();
                shortcut.action();
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);
}

// Example usage:
/*
useKeyboardShortcuts([
    {
        key: "Enter",
        ctrl: false,
        shift: false,
        alt: false,
        action: () => {
            // Handle Enter key
        }
    },
    {
        key: "s",
        ctrl: true,
        shift: false,
        alt: false,
        action: () => {
            // Handle Ctrl+S
        }
    }
]);
*/
