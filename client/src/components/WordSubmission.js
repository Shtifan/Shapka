import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Alert,
    Divider,
    Chip,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip,
    ListItemIcon,
    CircularProgress,
    LinearProgress,
    Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TimerIcon from "@mui/icons-material/Timer";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

function WordSubmission({ room, players, socket, playerName, team, onLeaveRoom }) {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentWord, setCurrentWord] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState({});

    useEffect(() => {
        const handlePlayerSubmitted = ({ playerId }) => {
            console.log(`Received playerSubmittedWords event for ${playerId}`);
            setSubmissionStatus((prev) => ({ ...prev, [playerId]: true }));
        };

        socket.on("playerSubmittedWords", handlePlayerSubmitted);

        const handleGameStarted = ({ players }) => {
            const initialStatus = {};
            players.forEach((p) => {
                if (p.words && p.words.length === 10) {
                    initialStatus[p.id] = true;
                }
            });
            setSubmissionStatus(initialStatus);
        };
        socket.on("gameStarted", handleGameStarted);

        if (players.length > 0) {
            const initialStatus = {};
            players.forEach((p) => {
                if (p.words && p.words.length === 10) {
                    initialStatus[p.id] = true;
                }
            });
            setSubmissionStatus(initialStatus);
        }

        return () => {
            socket.off("playerSubmittedWords", handlePlayerSubmitted);
            socket.off("gameStarted", handleGameStarted);
        };
    }, [socket, players]);

    useEffect(() => {
        const handleError = (errorMessage) => {
            console.error("WordSubmission Error Listener:", errorMessage);
            setError(errorMessage);
            setIsSubmitting(false);
            setTimeout(() => setError(null), 5000);
        };
        socket.on("error", handleError);
        return () => {
            socket.off("error", handleError);
        };
    }, [socket]);

    const handleAddWord = (e) => {
        e.preventDefault();
        setError(null);
        if (currentWord.trim() && words.length < 5) {
            setWords([...words, currentWord.trim().toLowerCase()]);
            setCurrentWord("");
        } else if (words.length >= 5) {
            setError("You have already added 5 words.");
        } else {
            setError("Please enter a valid word.");
        }
    };

    const handleSubmitWords = () => {
        setError(null);
        if (words.length === 5) {
            setIsSubmitting(true);
            console.log("Submitting words:", words);
            socket.emit("submitWords", { roomName: room, words });
            setTimeout(() => {
                if (isSubmitting) {
                    setIsSubmitting(false);
                    setError("Submission confirmation timed out.");
                }
            }, 5000);
        } else {
            setError("You must submit exactly 5 words.");
        }
    };

    const handleRemoveWord = (index) => {
        setWords(words.filter((_, i) => i !== index));
    };

    const getTeamMembers = () => {
        if (!team) return players;
        return players.filter((player) => player.team === team);
    };

    const getOtherTeamMembers = () => {
        if (!team) return [];
        return players.filter((player) => player.team !== team && player.team != null);
    };

    const teamMembers = getTeamMembers();
    const otherTeamMembers = getOtherTeamMembers();

    const progressPercentage = (words.length / 5) * 100;
    const hasSubmitted = submissionStatus[socket.id] === true || (words.length === 5 && isSubmitting);

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", pb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 2, bgcolor: "#1e1e1e", color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Room: {room}
                    </Typography>
                    <Chip
                        label={`Word Submission Phase`}
                        variant="outlined"
                        icon={<TimerIcon sx={{ color: "#64b5f6 !important" }} />}
                        sx={{ fontWeight: "bold", color: "#64b5f6", borderColor: "#64b5f6" }}
                    />
                </Box>

                <Card
                    sx={{
                        my: 3,
                        bgcolor: team ? getTeamBackgroundColor(team) : "rgba(255,255,255,0.05)",
                        borderRadius: 2,
                        boxShadow: 1,
                        border: team ? `1px solid ${getTeamBorderColor(team)}` : `1px solid rgba(255,255,255,0.1)`,
                    }}
                >
                    <CardContent sx={{ p: 3, textAlign: "center" }}>
                        <Typography
                            variant="h5"
                            color={team ? getTeamColorDark(team) : "#aaa"}
                            fontWeight="bold"
                            gutterBottom
                        >
                            You are in {getTeamName(team)}
                        </Typography>

                        <Box sx={{ mt: 2, mb: 1, px: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={progressPercentage}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: "rgba(255,255,255,0.1)",
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 5,
                                        bgcolor: hasSubmitted ? "#81c784" : getTeamProgressColor(team),
                                        transition: "transform .4s linear",
                                    },
                                }}
                            />
                            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "rgba(255,255,255,0.7)" }}>
                                {words.length}/5 words entered
                            </Typography>
                        </Box>

                        {hasSubmitted && (
                            <Chip
                                icon={<CheckCircleIcon />}
                                label="Your words are submitted!"
                                color="success"
                                size="small"
                                sx={{ mt: 1, fontWeight: "bold", bgcolor: "#2e7d32", color: "white" }}
                            />
                        )}
                    </CardContent>
                </Card>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Submit 5 Words
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)" gutterBottom sx={{ mb: 2 }}>
                            Enter 5 words (nouns, verbs, names...) that your teammates will guess.
                        </Typography>

                        <Box component="form" onSubmit={handleAddWord} sx={{ mb: 3 }}>
                            <TextField
                                label="Add a word"
                                variant="filled"
                                value={currentWord}
                                onChange={(e) => setCurrentWord(e.target.value)}
                                fullWidth
                                size="medium"
                                sx={{
                                    mb: 1,
                                    bgcolor: "rgba(255,255,255,0.09)",
                                    borderRadius: 1,
                                    "& .MuiFilledInput-root": {
                                        backgroundColor: "rgba(255,255,255,0.09)",
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.13)",
                                        },
                                        "&.Mui-focused": {
                                            backgroundColor: "rgba(255,255,255,0.13)",
                                        },
                                    },
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#64b5f6" },
                                    "& .MuiFilledInput-input": { color: "white" },
                                }}
                                disabled={words.length >= 5 || hasSubmitted}
                                placeholder="Type a word and press Add"
                                InputProps={{
                                    disableUnderline: true,
                                    endAdornment: (
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="small"
                                            disabled={!currentWord.trim() || words.length >= 5 || hasSubmitted}
                                            startIcon={<AddIcon />}
                                            sx={{
                                                ml: 1,
                                                bgcolor: "#64b5f6",
                                                color: "#111",
                                                "&:hover": { bgcolor: "#90caf9" },
                                                "&.Mui-disabled": {
                                                    bgcolor: "rgba(255,255,255,0.12)",
                                                    color: "rgba(255,255,255,0.3)",
                                                },
                                            }}
                                        >
                                            Add
                                        </Button>
                                    ),
                                }}
                            />
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        <Card
                            variant="outlined"
                            sx={{ mb: 3, borderRadius: 2, bgcolor: "#282828", borderColor: "rgba(255,255,255,0.1)" }}
                        >
                            <List sx={{ p: 0 }}>
                                {words.length > 0 ? (
                                    words.map((word, index) => (
                                        <React.Fragment key={index}>
                                            {index > 0 && <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />}
                                            <ListItem
                                                secondaryAction={
                                                    <Tooltip title="Remove word">
                                                        <span>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="delete"
                                                                onClick={() => handleRemoveWord(index)}
                                                                color="error"
                                                                size="small"
                                                                disabled={hasSubmitted}
                                                                sx={{
                                                                    color: "#f48fb1",
                                                                    "&:hover": { bgcolor: "rgba(244, 143, 177, 0.1)" },
                                                                    "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                }
                                                sx={{ pr: 10 }}
                                            >
                                                <ListItemText
                                                    primary={word}
                                                    primaryTypographyProps={{
                                                        fontWeight: "medium",
                                                        variant: "body1",
                                                        color: "rgba(255,255,255,0.9)",
                                                    }}
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText
                                            primary="No words added yet"
                                            secondary="Add up to 5 words for the game"
                                            primaryTypographyProps={{ color: "rgba(255,255,255,0.5)" }}
                                            secondaryTypographyProps={{ color: "rgba(255,255,255,0.4)" }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Card>

                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={onLeaveRoom}
                                size="large"
                                startIcon={<ExitToAppIcon />}
                                sx={{
                                    borderColor: "#f44336",
                                    color: "#f44336",
                                    "&:hover": {
                                        backgroundColor: "rgba(244,67,54,0.08)",
                                        borderColor: "#d32f2f",
                                    },
                                }}
                            >
                                Leave Room
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleSubmitWords}
                                disabled={words.length !== 5 || isSubmitting || hasSubmitted}
                                size="large"
                                startIcon={
                                    isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />
                                }
                                sx={{
                                    fontWeight: "bold",
                                    bgcolor: !hasSubmitted && words.length === 5 ? "#66bb6a" : "#444",
                                    color: "#111",
                                    "&:hover": {
                                        bgcolor: !hasSubmitted && words.length === 5 ? "#81c784" : "#444",
                                    },
                                    "&.Mui-disabled": {
                                        bgcolor: hasSubmitted ? "#2e7d32" : "rgba(255,255,255,0.12)",
                                        color: hasSubmitted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                                    },
                                }}
                            >
                                {isSubmitting ? "Submitting..." : hasSubmitted ? "Words Submitted" : "Submit 5 Words"}
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: "#282828", height: "100%" }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Player Status
                            </Typography>

                            <List
                                dense
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.05)",
                                    borderRadius: 2,
                                    "& .MuiListItem-root": {
                                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        py: 1,
                                    },
                                    "& .MuiListItem-root:last-child": {
                                        borderBottom: "none",
                                    },
                                }}
                            >
                                {[...teamMembers, ...otherTeamMembers].map((player) => (
                                    <ListItem key={player.id}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <Avatar
                                                sx={{
                                                    width: 30,
                                                    height: 30,
                                                    bgcolor: player.team ? getTeamAvatarColor(player.team) : "grey.700",
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 18 }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${player.name}${player.id === socket.id ? " (You)" : ""}`}
                                            secondary={getTeamName(player.team)}
                                            primaryTypographyProps={{
                                                fontWeight: player.id === socket.id ? "bold" : "normal",
                                                color: "white",
                                            }}
                                            secondaryTypographyProps={{
                                                color: player.team ? getTeamColorDark(player.team) : "#aaa",
                                            }}
                                        />
                                        {submissionStatus[player.id] === true ? (
                                            <Tooltip title="Words Submitted">
                                                <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Still thinking...">
                                                <TimerIcon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                                            </Tooltip>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

function getTeamProgressColor(teamName) {
    if (!teamName) return "#64b5f6";

    switch (teamName) {
        case "team1":
            return "#64b5f6";
        case "team2":
            return "#f48fb1";
        case "team3":
            return "#81c784";
        case "team4":
            return "#ffb74d";
        default:
            return "#64b5f6";
    }
}

function getTeamColorDark(teamName) {
    if (!teamName) return "#aaa";
    switch (teamName) {
        case "team1":
            return "#64b5f6";
        case "team2":
            return "#f48fb1";
        case "team3":
            return "#81c784";
        case "team4":
            return "#ffb74d";
        default:
            return "#aaa";
    }
}

function getTeamBackgroundColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.05)";
    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.15)";
        case "team2":
            return "rgba(233,30,99,0.15)";
        case "team3":
            return "rgba(76,175,80,0.15)";
        case "team4":
            return "rgba(255,152,0,0.15)";
        default:
            return "rgba(255,255,255,0.05)";
    }
}

function getTeamBorderColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.1)";
    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.3)";
        case "team2":
            return "rgba(233,30,99,0.3)";
        case "team3":
            return "rgba(76,175,80,0.3)";
        case "team4":
            return "rgba(255,152,0,0.3)";
        default:
            return "rgba(255,255,255,0.1)";
    }
}

function getTeamAvatarColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.2)";
    switch (teamName) {
        case "team1":
            return "#42a5f5";
        case "team2":
            return "#ec407a";
        case "team3":
            return "#66bb6a";
        case "team4":
            return "#ffa726";
        default:
            return "rgba(255,255,255,0.2)";
    }
}

function getTeamName(teamName) {
    if (!teamName) return "No Team";
    const teamNumber = teamName.replace("team", "");
    return `Team ${teamNumber}`;
}

export default WordSubmission;
