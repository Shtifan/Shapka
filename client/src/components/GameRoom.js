import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Alert,
    Chip,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    ListItemIcon,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

function GameRoom({ room, players, socket, playerName, gameState, onLeaveRoom }) {
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        // Find player's team when players list updates
        const currentPlayer = players.find((p) => p.id === socket.id);
        if (currentPlayer && currentPlayer.team) {
            setTeam(currentPlayer.team);
        }

        // Clear error when players change (e.g., someone joins/leaves)
        setError(null);
    }, [players, socket.id]); // React to changes in players list

    useEffect(() => {
        // Only handle errors relevant to this component
        const handleError = (errorMessage) => {
            // Ignore errors not relevant? Or display all?
            // Displaying all for now.
            console.error("GameRoom Error Listener:", errorMessage);
            setError(errorMessage);
            setIsStarting(false); // Ensure loading state resets on error
            // Clear error after some time
            setTimeout(() => setError(null), 5000);
        };

        socket.on("error", handleError);

        return () => {
            socket.off("error", handleError);
        };
    }, [socket]); // Only depends on socket

    const handleStartGame = () => {
        setError(null); // Clear previous errors
        setIsStarting(true);
        socket.emit("startGame", room);
        // Don't rely on timeout to reset isStarting, handle error/success event if possible
        // For now, keep a safety timeout
        setTimeout(() => {
            if (isStarting) {
                // Only reset if still starting (no success/error yet)
                setIsStarting(false);
                console.log("Resetting start button state after timeout");
            }
        }, 3000); // Longer safety timeout
    };

    // Group players by team
    const teamPlayers = {};
    players.forEach((player) => {
        const teamKey = player.team || "unassigned";
        if (!teamPlayers[teamKey]) {
            teamPlayers[teamKey] = [];
        }
        teamPlayers[teamKey].push(player);
    });

    const canStart = players.length >= 4 && players.length % 2 === 0 && gameState === "waiting";

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", pb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 2, bgcolor: "#1e1e1e" }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        mb: 3,
                    }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom color="white">
                            Room: {room}
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

                    {/* REMOVED Leader Chip */}
                </Box>

                {/* Display Team Info if assigned */}
                {team && gameState !== "waiting" && (
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: getTeamBackgroundColor(team),
                            borderRadius: 2,
                            border: `1px solid ${getTeamBorderColor(team)}`,
                        }}
                    >
                        <Typography variant="h6" color={getTeamColorDark(team)} fontWeight="bold">
                            You are in {getTeamName(team)}
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Card sx={{ mb: 4, mt: 2, bgcolor: "#282828", borderRadius: 2, boxShadow: 2, color: "white" }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <GroupIcon sx={{ mr: 1, color: "#64b5f6" }} />
                            <Typography variant="h6" fontWeight="bold" color="white">
                                Players ({players.length})
                            </Typography>
                        </Box>

                        {/* Status message only shown when waiting */}
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
                                {players.length < 4 ? (
                                    <>
                                        <span style={{ fontSize: "1.5rem", marginRight: "8px" }}>⚠️</span>
                                        Need at least {4 - players.length} more player{4 - players.length !== 1 ? "s" : ""}
                                        {` `}to start
                                    </>
                                ) : players.length % 2 !== 0 ? (
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

                        {/* Player List */}
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
                                                // Add indicator for disconnected? e.g., opacity: player.disconnected ? 0.5 : 1
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
                                                // sx={{ textDecoration: player.disconnected ? 'line-through' : 'none' }}
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

                {/* Action Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: gameState === "waiting" ? "space-between" : "flex-end", // Align leave button right if game started
                        mt: 3,
                        gap: 2,
                    }}
                >
                    {/* Show Start Game Button ONLY if in waiting state */}
                    {gameState === "waiting" && (
                        <Button
                            variant="contained"
                            onClick={handleStartGame}
                            disabled={!canStart || isStarting}
                            size="large"
                            startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                            sx={{
                                minWidth: 180,
                                py: 1.5,
                                order: { xs: 1, md: 2 },
                                fontWeight: "bold",
                                bgcolor: canStart && !isStarting ? "#64b5f6" : "#444", // Updated enabled color logic
                                color: "#111",
                                "&:hover": {
                                    bgcolor: canStart ? "#90caf9" : "#444", // Only change hover if enabled
                                },
                                "&.Mui-disabled": {
                                    bgcolor: "rgba(255,255,255,0.12)",
                                    color: "rgba(255,255,255,0.3)",
                                },
                            }}
                            fullWidth={window.innerWidth < 900}
                        >
                            {isStarting ? "Starting..." : "Start Game"}
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        color="error"
                        onClick={onLeaveRoom}
                        size="large"
                        startIcon={<ExitToAppIcon />}
                        fullWidth={window.innerWidth < 900}
                        sx={{
                            order: { xs: 2, md: 1 },
                            borderColor: "#f44336",
                            color: "#f44336",
                            "&:hover": {
                                backgroundColor: "rgba(244,67,54,0.08)",
                                borderColor: "#d32f2f",
                            },
                            // Push Leave button to the start if Start button isn't shown
                            marginLeft: gameState !== "waiting" ? "auto" : 0,
                        }}
                    >
                        Leave Room
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

// Helper functions for team styling
function getTeamTextColor(teamName) {
    if (!teamName) return "text.primary";

    switch (teamName) {
        case "team1":
            return "#2196f3"; // Blue
        case "team2":
            return "#e91e63"; // Pink/Purple
        case "team3":
            return "#4caf50"; // Green
        case "team4":
            return "#ff9800"; // Amber/Orange
        default:
            return "#ffffff"; // Default white
    }
}

function getTeamColorDark(teamName) {
    if (!teamName) return "#aaa";

    switch (teamName) {
        case "team1":
            return "#64b5f6"; // Lighter blue for dark mode
        case "team2":
            return "#f48fb1"; // Lighter pink for dark mode
        case "team3":
            return "#81c784"; // Lighter green for dark mode
        case "team4":
            return "#ffb74d"; // Lighter amber for dark mode
        default:
            return "#aaa"; // Light grey for dark mode
    }
}

function getTeamBackgroundColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.05)";

    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.15)"; // Semi-transparent blue
        case "team2":
            return "rgba(233,30,99,0.15)"; // Semi-transparent pink
        case "team3":
            return "rgba(76,175,80,0.15)"; // Semi-transparent green
        case "team4":
            return "rgba(255,152,0,0.15)"; // Semi-transparent amber
        default:
            return "rgba(255,255,255,0.05)"; // Semi-transparent white
    }
}

function getTeamBorderColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.1)";

    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.3)"; // Semi-transparent blue border
        case "team2":
            return "rgba(233,30,99,0.3)"; // Semi-transparent pink border
        case "team3":
            return "rgba(76,175,80,0.3)"; // Semi-transparent green border
        case "team4":
            return "rgba(255,152,0,0.3)"; // Semi-transparent amber border
        default:
            return "rgba(255,255,255,0.1)"; // Semi-transparent white border
    }
}

function getTeamAvatarColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.2)";

    switch (teamName) {
        case "team1":
            return "#42a5f5"; // Vibrant blue
        case "team2":
            return "#ec407a"; // Vibrant pink
        case "team3":
            return "#66bb6a"; // Vibrant green
        case "team4":
            return "#ffa726"; // Vibrant amber
        default:
            return "rgba(255,255,255,0.2)"; // Light transparent
    }
}

function getTeamName(teamName) {
    if (!teamName) return "No Team";

    // Extract team number from teamName (e.g., "team1" -> "Team 1")
    const teamNumber = teamName.replace("team", "");
    return `Team ${teamNumber}`;
}

export default GameRoom;
