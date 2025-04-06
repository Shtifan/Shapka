import React from "react";
import { Box, Typography, LinearProgress, Paper } from "@mui/material";

function SubmissionStatus({ players, submittedCount, totalRequired }) {
    const progress = totalRequired > 0 ? (submittedCount / totalRequired) * 100 : 0;

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#282828" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" color="white">
                    Word Submission Progress
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {submittedCount} / {totalRequired} players
                </Typography>
            </Box>

            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                        bgcolor: progress === 100 ? "#81c784" : "#64b5f6",
                        borderRadius: 5,
                    },
                }}
            />

            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {progress === 100
                        ? "All players have submitted their words! The game will start soon."
                        : "Waiting for all players to submit their words..."}
                </Typography>
            </Box>
        </Paper>
    );
}

export default SubmissionStatus;
