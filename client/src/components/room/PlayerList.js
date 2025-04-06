import React from "react";
import { Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Typography, Avatar, Box } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import { getTeamAvatarColor, getTeamColorDark, getTeamName } from "../common/teamUtils";

function PlayerList({ players, socket, gameState, playerCount, canStart }) {
    return (
        <Card sx={{ mb: 4, mt: 2, bgcolor: "#282828", borderRadius: 2, boxShadow: 2, color: "white" }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, color: "#64b5f6" }} />
                    <Typography variant="h6" fontWeight="bold" color="white">
                        Players ({playerCount})
                    </Typography>
                </Box>

                {gameState === "waiting" && (
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: "rgba(255,255,255,0.08)",
                            borderRadius: 2,
                            color: canStart ? "#81c784" : "#ffb74d",
                            fontWeight: "medium",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        {playerCount < 4 ? (
                            <>
                                <span style={{ fontSize: "1.5rem", marginRight: "8px" }}>⚠️</span>
                                Need at least {4 - playerCount} more player{4 - playerCount !== 1 ? "s" : ""}
                                {` `}to start
                            </>
                        ) : playerCount % 2 !== 0 ? (
                            <>
                                <span style={{ fontSize: "1.5rem", marginRight: "8px" }}>⚠️</span>
                                Need an even number of players to start
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: "1.5rem", marginRight: "8px" }}>✅</span>
                                Ready to start the game!
                            </>
                        )}
                    </Typography>
                )}

                <List
                    sx={{
                        bgcolor: "rgba(255,255,255,0.05)",
                        borderRadius: 2,
                        "& .MuiListItem-root": {
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            py: 1.5,
                        },
                        "& .MuiListItem-root:last-child": {
                            borderBottom: "none",
                        },
                    }}
                >
                    {players.map((player) => (
                        <ListItem key={player.id}>
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        bgcolor: player.team ? getTeamAvatarColor(player.team) : "grey.700",
                                    }}
                                >
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body1"
                                        fontWeight={player.id === socket.id ? "bold" : "medium"}
                                        color="white"
                                    >
                                        {player.name} {player.id === socket.id ? "(You)" : ""}
                                    </Typography>
                                }
                                secondary={
                                    player.team && (
                                        <Typography
                                            variant="body2"
                                            color={getTeamColorDark(player.team)}
                                            sx={{ fontWeight: "medium" }}
                                        >
                                            {getTeamName(player.team)}
                                        </Typography>
                                    )
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}

export default PlayerList;
