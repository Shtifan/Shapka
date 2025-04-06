import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { useWordSubmission } from "../../hooks/useWordSubmission";
import { useGameState } from "../../hooks/useGameState";
import WordInput from "./WordInput";
import WordList from "./WordList";
import SubmissionStatus from "./SubmissionStatus";

function WordSubmission({ roomName }) {
    const { gameState } = useGameState(roomName);
    const { words, error, isSubmitting, hasSubmitted, submitWords, validateWords } = useWordSubmission(roomName);

    if (!gameState.isWordSubmissionPhase) {
        return null;
    }

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
                <Typography variant="h5" component="h2" gutterBottom>
                    Word Submission Phase
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: "rgba(255,255,255,0.7)" }}>
                    Submit 5 words that other players will try to guess during the game. Words should be unique and can only
                    contain letters and spaces.
                </Typography>

                {!hasSubmitted && (
                    <WordInput
                        onSubmit={submitWords}
                        validateWords={validateWords}
                        error={error}
                        isSubmitting={isSubmitting}
                    />
                )}

                {hasSubmitted && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Your submitted words:
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                "& > *": {
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    color: "white",
                                    px: 2,
                                    py: 1,
                                    borderRadius: 1,
                                },
                            }}
                        >
                            {words.map((word, index) => (
                                <Typography key={index} variant="body2">
                                    {word}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>

            <SubmissionStatus
                submittedCount={gameState.getSubmittedWordsCount()}
                totalRequired={gameState.getTotalRequiredWords()}
            />

            <WordList players={gameState.players} teams={gameState.teams} submittedWords={gameState.submittedWords} />
        </Box>
    );
}

export default WordSubmission;
