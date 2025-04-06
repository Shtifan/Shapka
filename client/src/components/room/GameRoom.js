import React, { useEffect } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { useParams } from "react-router-dom";
import { useRoom } from "../../hooks/useRoom";
import { useGameState } from "../../hooks/useGameState";
import RoomHeader from "./RoomHeader";
import PlayerList from "./PlayerList";
import GameControls from "./GameControls";
import WordSubmission from "../word/WordSubmission";
import GamePlay from "../game/GamePlay";

function GameRoom() {
    const { roomName } = useParams();
    const { isJoining, error, isConnected, leaveRoom, connect } = useRoom(roomName);
    const { gameState, isLoading } = useGameState(roomName);

    useEffect(() => {
        // Connect to server when component mounts
        connect("http://localhost:3001");

        // Cleanup when component unmounts
        return () => {
            leaveRoom();
        };
    }, [connect, leaveRoom]);

    if (!isConnected || isJoining || isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    bgcolor: "#1a1a1a",
                    color: "white",
                }}
            >
                <CircularProgress sx={{ mb: 2 }} />
                <Box>
                    {!isConnected && "Connecting to server..."}
                    {isConnected && isJoining && "Joining room..."}
                    {isConnected && !isJoining && isLoading && "Loading game state..."}
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#1a1a1a",
                color: "white",
                pb: 4,
            }}
        >
            <RoomHeader roomName={roomName} gameState={gameState} onLeave={leaveRoom} />

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        maxWidth: 800,
                        mx: "auto",
                        mt: 2,
                        bgcolor: "rgba(211, 47, 47, 0.1)",
                        color: "#ff1744",
                    }}
                >
                    {error}
                </Alert>
            )}

            <PlayerList players={gameState.players} teams={gameState.teams} />

            {gameState.gameState === "waiting" && <GameControls gameState={gameState} roomName={roomName} />}

            {gameState.gameState === "wordSubmission" && <WordSubmission roomName={roomName} />}

            {gameState.gameState === "playing" && <GamePlay roomName={roomName} />}
        </Box>
    );
}

export default GameRoom;
