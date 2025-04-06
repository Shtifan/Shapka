import React from "react";
import { Box, Typography, Paper, Chip, Grid } from "@mui/material";
import { getTeamColorDark, getTeamName } from "../common/teamUtils";

function WordList({ players, teams, submittedWords }) {
    // Group players by team
    const teamPlayers = {};
    players.forEach((player) => {
        const teamKey = player.team || "unassigned";
        if (!teamPlayers[teamKey]) {
            teamPlayers[teamKey] = [];
        }
        teamPlayers[teamKey].push(player);
    });

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#282828" }}>
            <Typography variant="h6" gutterBottom color="white">
                Word Submission Status
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {Object.keys(teams).length > 0
                        ? "Players are submitting words for their teams."
                        : "Players need to be assigned to teams before submitting words."}
                </Typography>
            </Box>

            {Object.keys(teams).map((teamName) => (
                <Box key={teamName} sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: getTeamColorDark(teamName),
                            fontWeight: "bold",
                            mb: 1,
                        }}
                    >
                        {getTeamName(teamName)}
                    </Typography>

                    <Grid container spacing={2}>
                        {teams[teamName].map((player) => {
                            const hasSubmitted = submittedWords[player.id];
                            return (
                                <Grid item xs={12} sm={6} md={4} key={player.id}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 1,
                                            bgcolor: "rgba(255,255,255,0.05)",
                                            border: `1px solid ${
                                                hasSubmitted ? getTeamColorDark(teamName) : "rgba(255,255,255,0.1)"
                                            }`,
                                            opacity: hasSubmitted ? 1 : 0.7,
                                        }}
                                    >
                                        <Typography variant="body2" color="white">
                                            {player.name}
                                        </Typography>
                                        <Chip
                                            label={hasSubmitted ? "Submitted" : "Waiting..."}
                                            size="small"
                                            sx={{
                                                mt: 1,
                                                bgcolor: hasSubmitted ? "rgba(129,199,132,0.2)" : "rgba(255,255,255,0.1)",
                                                color: hasSubmitted ? "#81c784" : "rgba(255,255,255,0.5)",
                                                border: hasSubmitted
                                                    ? "1px solid #81c784"
                                                    : "1px solid rgba(255,255,255,0.1)",
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            ))}
        </Paper>
    );
}

export default WordList;
