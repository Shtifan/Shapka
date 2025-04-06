import { useState, useEffect, useCallback, useRef } from "react";
import { SOCKET_EVENTS, SERVER_URL } from "../constants";
import socketManager from "../utils/socket";

export function useRoom(roomName) {
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const connectionAttempted = useRef(false);

    const connect = useCallback((url = SERVER_URL) => {
        console.log("Attempting to connect to server at:", url);
        try {
            socketManager.connect(url);
            setError(null);
        } catch (err) {
            console.error("Connection error:", err);
            setError("Failed to connect to server: " + (err.message || "Unknown error"));
        }
    }, []);

    const disconnect = useCallback(() => {
        console.log("Disconnecting from server");
        socketManager.disconnect();
        setIsConnected(false);
    }, []);

    const joinRoom = useCallback(
        (playerName) => {
            console.log("Attempting to join room:", roomName, "as player:", playerName);

            if (!isConnected) {
                console.error("Cannot join room: not connected to server");
                setError("Not connected to server");
                return;
            }

            setIsJoining(true);
            setError(null);
            socketManager.joinRoom(roomName, playerName);
        },
        [roomName, isConnected]
    );

    const leaveRoom = useCallback(() => {
        console.log("Leaving room:", roomName);
        socketManager.leaveRoom(roomName);
    }, [roomName]);

    useEffect(() => {
        console.log("Setting up socket event handlers");

        const handleConnect = () => {
            console.log("Connected to server");
            setIsConnected(true);
            setError(null);
        };

        const handleDisconnect = () => {
            console.log("Disconnected from server");
            setIsConnected(false);
        };

        const handleRoomJoined = () => {
            console.log("Room joined successfully");
            setIsJoining(false);
            setError(null);
        };

        const handleError = (error) => {
            console.error("Socket error:", error);
            setIsJoining(false);
            setError(error);
        };

        // Connect to server if not already connected and not attempted yet
        if (!isConnected && !connectionAttempted.current) {
            console.log("Not connected, attempting to connect");
            connectionAttempted.current = true;
            connect();
        }

        socketManager.on(SOCKET_EVENTS.CONNECT, handleConnect);
        socketManager.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        socketManager.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
        socketManager.on(SOCKET_EVENTS.ERROR, handleError);

        return () => {
            console.log("Cleaning up socket event handlers");
            socketManager.off(SOCKET_EVENTS.CONNECT, handleConnect);
            socketManager.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
            socketManager.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
            socketManager.off(SOCKET_EVENTS.ERROR, handleError);
        };
    }, [isConnected, connect]);

    return {
        isJoining,
        error,
        isConnected,
        joinRoom,
        leaveRoom,
        connect,
        disconnect,
    };
}
