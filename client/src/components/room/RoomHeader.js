import React from "react";
import { Box, Typography } from "@mui/material";

function RoomHeader({ roomName, gameState }) {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="white">
                Room: {roomName}
            </Typography>
            <Typography
                variant="body1"
                sx={{
                    color: "rgba(255,255,255,0.7)",
                    py: 0.5,
                    px: 0,
                    borderRadius: 1,
                    display: "inline-block",
                }}
            >
                {gameState === "waiting"
                    ? "Waiting for players..."
                    : gameState === "wordSubmission"
                    ? "Submitting words..."
                    : gameState === "playing"
                    ? "Game in progress!"
                    : "Game Lobby"}
            </Typography>
        </Box>
    );
}

export default RoomHeader;
