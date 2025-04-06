import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, TextField, Button, Alert, Container } from "@mui/material";

function Home() {
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [error, setError] = useState("");

    const handleJoinRoom = (e) => {
        e.preventDefault();

        if (!roomName.trim()) {
            setError("Please enter a room name");
            return;
        }

        if (!playerName.trim()) {
            setError("Please enter your name");
            return;
        }

        // Store player name in session storage
        sessionStorage.setItem("playerName", playerName.trim());

        // Navigate to the game room
        navigate(`/room/${roomName.trim()}`);
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    py: 4,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: "#282828",
                        color: "white",
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                            backgroundClip: "text",
                            textFillColor: "transparent",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Shapka
                    </Typography>

                    <Typography
                        variant="subtitle1"
                        sx={{
                            textAlign: "center",
                            mb: 4,
                            color: "rgba(255,255,255,0.7)",
                        }}
                    >
                        A fun word guessing game to play with friends!
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                bgcolor: "rgba(211, 47, 47, 0.1)",
                                color: "#ff1744",
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleJoinRoom}>
                        <TextField
                            fullWidth
                            label="Room Name"
                            variant="outlined"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    color: "white",
                                    "& fieldset": {
                                        borderColor: "rgba(255,255,255,0.3)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255,255,255,0.5)",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "primary.main",
                                    },
                                },
                                "& .MuiInputLabel-root": {
                                    color: "rgba(255,255,255,0.7)",
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Your Name"
                            variant="outlined"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            sx={{
                                mb: 3,
                                "& .MuiOutlinedInput-root": {
                                    color: "white",
                                    "& fieldset": {
                                        borderColor: "rgba(255,255,255,0.3)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255,255,255,0.5)",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "primary.main",
                                    },
                                },
                                "& .MuiInputLabel-root": {
                                    color: "rgba(255,255,255,0.7)",
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                                background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                                color: "white",
                                boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                                "&:hover": {
                                    background: "linear-gradient(45deg, #FE5981 30%, #FF8349 90%)",
                                },
                            }}
                        >
                            Join Room
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}

export default Home;
