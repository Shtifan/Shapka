import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Home({ onJoinRoom, error }) {
    const [roomName, setRoomName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState("");
    const navigate = useNavigate();

    // Clear any stored session data on component mount
    useEffect(() => {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("playerName");
        localStorage.removeItem("roomName");
    }, []);

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomName.trim() && playerName.trim()) {
            setIsLoading(true);
            setLocalError("");
            onJoinRoom(roomName.trim(), playerName.trim());
            // We'll show loading for at least 1 second
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        } else {
            setLocalError("Please enter both your name and a room name");
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                minHeight: "80vh",
                justifyContent: "center",
            }}
        >
            <Typography variant="h2" component="h1" gutterBottom>
                Shapka
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: "100%",
                    maxWidth: 400,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h5" align="center" gutterBottom>
                    Join or Create a Room
                </Typography>

                {(error || localError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error || localError}
                    </Alert>
                )}

                <TextField
                    label="Your Name"
                    variant="outlined"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    fullWidth
                    disabled={isLoading}
                    required
                />

                <TextField
                    label="Room Name"
                    variant="outlined"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    fullWidth
                    disabled={isLoading}
                    required
                    helperText="Enter a room name to join or create."
                />

                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleJoinRoom}
                        fullWidth
                        disabled={!roomName.trim() || !playerName.trim()}
                        size="large"
                    >
                        Join / Create Room
                    </Button>
                )}
            </Paper>
        </Box>
    );
}

export default Home;
