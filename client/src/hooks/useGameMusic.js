import { useState, useEffect, useCallback } from "react";
import { useGameSettings } from "./useGameSettings";

const MUSIC_TRACKS = {
    MENU: "/music/menu.mp3",
    LOBBY: "/music/lobby.mp3",
    GAME: "/music/game.mp3",
    INTENSE: "/music/intense.mp3",
    VICTORY: "/music/victory.mp3",
    DEFEAT: "/music/defeat.mp3"
};

export function useGameMusic() {
    const { settings } = useGameSettings();
    const [currentTrack, setCurrentTrack] = useState(null);
    const [audio, setAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);

    useEffect(() => {
        // Clean up audio when component unmounts
        return () => {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
        };
    }, [audio]);

    useEffect(() => {
        // Update audio when settings change
        if (audio) {
            audio.volume = settings.musicEnabled ? volume : 0;
        }
    }, [audio, settings.musicEnabled, volume]);

    const loadTrack = useCallback((trackName) => {
        if (!MUSIC_TRACKS[trackName]) {
            console.warn(`Invalid track name: ${trackName}`);
            return;
        }

        // Stop current track if playing
        if (audio) {
            audio.pause();
            audio.src = "";
        }

        // Create new audio element
        const newAudio = new Audio(MUSIC_TRACKS[trackName]);
        newAudio.loop = true;
        newAudio.volume = settings.musicEnabled ? volume : 0;

        // Set up event listeners
        newAudio.addEventListener("canplaythrough", () => {
            if (settings.musicEnabled) {
                newAudio.play().catch(error => {
                    console.warn("Failed to play audio:", error);
                });
            }
        });

        newAudio.addEventListener("play", () => {
            setIsPlaying(true);
        });

        newAudio.addEventListener("pause", () => {
            setIsPlaying(false);
        });

        newAudio.addEventListener("ended", () => {
            setIsPlaying(false);
        });

        setAudio(newAudio);
        setCurrentTrack(trackName);
    }, [audio, settings.musicEnabled, volume]);

    const play = useCallback(() => {
        if (audio && settings.musicEnabled) {
            audio.play().catch(error => {
                console.warn("Failed to play audio:", error);
            });
        }
    }, [audio, settings.musicEnabled]);

    const pause = useCallback(() => {
        if (audio) {
            audio.pause();
        }
    }, [audio]);

    const stop = useCallback(() => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, [audio]);

    const setMusicVolume = useCallback((newVolume) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        if (audio) {
            audio.volume = settings.musicEnabled ? clampedVolume : 0;
        }
    }, [audio, settings.musicEnabled]);

    const playMenuMusic = useCallback(() => {
        loadTrack("MENU");
    }, [loadTrack]);

    const playLobbyMusic = useCallback(() => {
        loadTrack("LOBBY");
    }, [loadTrack]);

    const playGameMusic = useCallback(() => {
        loadTrack("GAME");
    }, [loadTrack]);

    const playIntenseMusic = useCallback(() => {
        loadTrack("INTENSE");
    }, [loadTrack]);

    const playVictoryMusic = useCallback(() => {
        loadTrack("VICTORY");
    }, [loadTrack]);

    const playDefeatMusic = useCallback(() => {
        loadTrack("DEFEAT");
    }, [loadTrack]);

    return {
        currentTrack,
        isPlaying,
        volume,
        play,
        pause,
        stop,
        setMusicVolume,
        playMenuMusic,
        playLobbyMusic,
        playGameMusic,
        playIntenseMusic,
        playVictoryMusic,
        playDefeatMusic
    };
} 