import React, { useState } from "react";
import { Box, Typography, Paper, TextField, Button, Alert } from "@mui/material";
import { useGamePlay } from "../../hooks/useGamePlay";
import { useGameState } from "../../hooks/useGameState";

function GamePlay({ roomName }) {
    const { gameState } = useGameState(roomName);
    const { currentWord, timer, isGuessing, roundScore, error, startTurn, guessWord, skipWord } = useGamePlay(roomName);

    const [guess, setGuess] = useState("");

    if (!gameState.isGameInProgress) {
        return null;
    }

    const handleGuessSubmit = (e) => {
        e.preventDefault();
        if (!guess.trim()) return;

        guessWord(guess.trim());
        setGuess("");
    };

    const handleSkip = () => {
        skipWord();
        setGuess("");
    };

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: "#282828",
                    color: "white",
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h5" component="h2">
                        Round {gameState.currentRound}
                    </Typography>
                    <Typography variant="h6">Score: {roundScore}</Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {isGuessing ? (
                    <Box>
                        <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
                            {currentWord}
                        </Typography>

                        <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                            Time remaining: {Math.ceil(timer / 1000)}s
                        </Typography>

                        <form onSubmit={handleGuessSubmit}>
                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    placeholder="Enter your guess..."
                                    sx={{
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
                                    }}
                                />
                                <Button type="submit" variant="contained" color="primary" disabled={!guess.trim()}>
                                    Guess
                                </Button>
                            </Box>
                        </form>

                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Button variant="outlined" color="error" onClick={handleSkip}>
                                Skip Word
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                            Waiting for turn to start...
                        </Typography>
                        <Button variant="contained" color="primary" onClick={startTurn}>
                            Start Turn
                        </Button>
                    </Box>
                )}
            </Paper>

            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "#282828",
                    color: "white",
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Team Scores
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                    <Box>
                        <Typography variant="subtitle1">Team 1</Typography>
                        <Typography variant="h5">{gameState.scores["Team 1"]}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1">Team 2</Typography>
                        <Typography variant="h5">{gameState.scores["Team 2"]}</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

export default GamePlay;
