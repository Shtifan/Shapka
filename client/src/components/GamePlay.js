import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    IconButton,
    Slide,
    Badge,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import TimerIcon from "@mui/icons-material/Timer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import CelebrationIcon from "@mui/icons-material/Celebration";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";
import BrushIcon from "@mui/icons-material/Brush";
import StarIcon from "@mui/icons-material/Star";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DoneIcon from "@mui/icons-material/Done";
import io from "socket.io-client";

function GamePlay({ room, players, socket, playerName, team, onLeaveRoom, isLeader }) {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState("waiting"); // waiting, roundStarting, playing, roundEnd, gameEnd
    const [rounds, setRounds] = useState([
        { name: "Describe", description: "Explain the word to your teammates" },
        { name: "One Word", description: "Use only ONE word to describe the noun" },
        { name: "Draw", description: "Act out or draw the word without speaking" },
    ]);
    const [currentRound, setCurrentRound] = useState(0);
    const [activeTeam, setActiveTeam] = useState(null);
    const [activePlayer, setActivePlayer] = useState(null);
    const [currentWord, setCurrentWord] = useState(null);
    const [teamScores, setTeamScores] = useState({});
    const [timer, setTimer] = useState(60);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [guessedWords, setGuessedWords] = useState([]);
    const [roundEndDialog, setRoundEndDialog] = useState(false);
    const [gameEndDialog, setGameEndDialog] = useState(false);
    const [winner, setWinner] = useState(null);
    const [error, setError] = useState(null);
    const [turnActive, setTurnActive] = useState(false);
    const [synchronizing, setSynchronizing] = useState(false);
    const timerRef = useRef(null);
    const socketId = socket.id;
    const [wordsLeft, setWordsLeft] = useState(0);
    const [teams, setTeams] = useState(["team1", "team2"]); // Define teams state variable

    // Request current game state on component mount
    useEffect(() => {
        console.log("Requesting current game state");
        setSynchronizing(true);
        socket.emit("requestGameState", { roomName: room });
    }, [socket, room]);

    // Effect for socket event listeners
    useEffect(() => {
        const handleRoundStarted = (data) => {
            console.log("Round started:", data);
            setGameState("roundStarting");
            setActiveTeam(data.activeTeam);
            setActivePlayer(data.activePlayer);
            setIsMyTurn(data.activePlayer === socket.id);
            setCurrentRound(data.currentRound);
            setTeamScores(data.teamScores);
            setTurnActive(true);

            // If it's my turn, draw a word
            if (data.activePlayer === socket.id) {
                setTimeout(() => {
                    console.log("My turn, requesting word");
                    socket.emit("drawWord", { roomName: room });
                }, 1000);
            }
        };

        const handleWordDrawn = (data) => {
            console.log("Word drawn:", data);
            setCurrentWord(data.word);
            setGameState("playing");

            // Start timer only when turn starts, not on each word
            if (!timerRef.current) {
                startTimer();
            }
        };

        const handleTurnEnded = (data) => {
            console.log("Turn ended:", data);
            stopTimer();
            setGameState("turnEnded");
            setGuessedWords(data.guessedWords || []);
            setActiveTeam(data.nextTeam);
            setTeamScores(data.teamScores);
            setCurrentWord(null);
            setTurnActive(false);
        };

        const handleRoundEnded = (data) => {
            console.log("Round ended:", data);
            setCurrentRound(data.nextRound);
            setRoundEndDialog(true);
            setTeamScores(data.teamScores);
            setGameState("roundEnd");
            setTurnActive(false);
        };

        const handleGameEnded = (data) => {
            console.log("Game ended:", data);
            setTeamScores(data.teamScores);
            setWinner(data.winner);
            setGameEndDialog(true);
            setGameState("gameEnd");
            setTurnActive(false);
        };

        const handleScoreUpdated = (data) => {
            console.log("Score updated:", data);
            setTeamScores(data.teamScores);
        };

        const handleError = (errorMessage) => {
            console.error("GamePlay Error:", errorMessage);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        };

        const handleGameStateUpdate = (data) => {
            console.log("Game state update received:", data);
            setSynchronizing(false);

            // Update all relevant state variables to match server state
            setGameState(data.gameState);
            setActiveTeam(data.activeTeam);
            setActivePlayer(data.activePlayer);
            setIsMyTurn(data.activePlayer === socket.id);
            setCurrentRound(data.currentRound);
            if (data.roundInfo) {
                setRounds((prev) => {
                    const newRounds = [...prev];
                    newRounds[data.currentRound] = data.roundInfo;
                    return newRounds;
                });
            }
            setTeamScores(data.teamScores);
            setTurnActive(data.turnActive);
            if (data.wordsLeft !== undefined) {
                setWordsLeft(data.wordsLeft);
            }

            // If it's already my turn in an active game, but I don't have a word
            // (possibly due to reconnection), request a new word
            if (data.activePlayer === socket.id && data.turnActive && !currentWord) {
                setTimeout(() => {
                    socket.emit("drawWord", { roomName: room });
                }, 1000);
            }
        };

        const handleBecameLeader = () => {
            console.log("You are now the room leader");
            // Force refresh game state
            socket.emit("requestGameState", { roomName: room });
        };

        const handleGameStarted = (data) => {
            console.log("Game started with teams:", data);
            // Extract team information from the data
            if (data.teams) {
                const teamIds = Object.keys(data.teams);
                console.log("Available teams:", teamIds);
                // Set the teams
                setTeams(teamIds);
            }
        };

        // Register event listeners
        socket.on("roundStarted", handleRoundStarted);
        socket.on("wordDrawn", handleWordDrawn);
        socket.on("turnEnded", handleTurnEnded);
        socket.on("roundEnded", handleRoundEnded);
        socket.on("gameEnded", handleGameEnded);
        socket.on("scoreUpdated", handleScoreUpdated);
        socket.on("error", handleError);
        socket.on("gameStateUpdate", handleGameStateUpdate);
        socket.on("becameLeader", handleBecameLeader);
        socket.on("gameStarted", handleGameStarted);

        return () => {
            socket.off("roundStarted", handleRoundStarted);
            socket.off("wordDrawn", handleWordDrawn);
            socket.off("turnEnded", handleTurnEnded);
            socket.off("roundEnded", handleRoundEnded);
            socket.off("gameEnded", handleGameEnded);
            socket.off("scoreUpdated", handleScoreUpdated);
            socket.off("error", handleError);
            socket.off("gameStateUpdate", handleGameStateUpdate);
            socket.off("becameLeader", handleBecameLeader);
            socket.off("gameStarted", handleGameStarted);
        };
    }, [socket, room, currentWord]);

    // Initialize rounds data from allWordsSubmitted event
    useEffect(() => {
        const handleAllWordsSubmitted = (data) => {
            console.log("All words submitted, game ready:", data);
            if (data.rounds) {
                setRounds(data.rounds);
            }
            setCurrentRound(data.currentRound || 0);
        };

        socket.on("allWordsSubmitted", handleAllWordsSubmitted);

        return () => {
            socket.off("allWordsSubmitted", handleAllWordsSubmitted);
        };
    }, [socket]);

    // Timer functions
    const startTimer = () => {
        setTimer(60);
        stopTimer(); // Clear any existing timers

        timerRef.current = setInterval(() => {
            setTimer((prevTimer) => {
                if (prevTimer <= 1) {
                    stopTimer();
                    // End turn when timer runs out
                    if (isMyTurn) {
                        socket.emit("endTurn", { roomName: room });
                    }
                    return 0;
                }
                return prevTimer - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Game action handlers
    const handleStartRound = () => {
        // Only leader can start rounds
        if (isLeader) {
            socket.emit("startRound", { roomName: room });
        } else {
            setError("Only the room leader can start rounds");
        }
    };

    const handleSkipWord = () => {
        if (isMyTurn && currentWord) {
            socket.emit("skipWord", { roomName: room, word: currentWord });
            // Don't reset timer when skipping
        }
    };

    const handleWordGuessed = () => {
        if (isMyTurn && currentWord) {
            socket.emit("wordGuessed", { roomName: room, word: currentWord });
            // Don't reset timer when guessing
        }
    };

    const handleEndTurn = () => {
        if (isMyTurn || isLeader) {
            socket.emit("endTurn", { roomName: room });
        }
    };

    // Get round name
    const getRoundName = (roundIndex) => {
        if (roundIndex < 0 || roundIndex >= rounds.length) return "Unknown Round";
        return rounds[roundIndex].name;
    };

    // Get team name from team id
    const getTeamName = (teamId) => {
        if (!teamId) return "";

        // Just use Team N format for consistent naming
        if (teamId.startsWith("team")) {
            const teamNumber = teamId.replace("team", "");
            return `Team ${teamNumber}`;
        }

        // Fallback for any other naming scheme
        return teamId;
    };

    // Get team color from team id
    const getTeamColor = (teamId) => {
        if (!teamId) return "#888";

        switch (teamId) {
            case "team1":
                return "#f44336";
            case "team2":
                return "#2196f3";
            case "team3":
                return "#4caf50";
            case "team4":
                return "#ffeb3b";
            default:
                return "#888";
        }
    };

    // Get round icon
    const getRoundIcon = (roundIndex) => {
        switch (roundIndex) {
            case 0:
                return <LooksOneIcon />;
            case 1:
                return <LooksTwoIcon />;
            case 2:
                return <Looks3Icon />;
            default:
                return null;
        }
    };

    // Team scores and players component
    const renderTeamInfo = () => {
        // Organize players by team
        const teamPlayers = {};

        // Get team list dynamically from player data
        const teamSet = new Set();
        players.forEach((player) => {
            if (player.team) {
                teamSet.add(player.team);
            }
        });

        const availableTeams = Array.from(teamSet);

        // Group players by team
        availableTeams.forEach((t) => {
            teamPlayers[t] = players.filter((p) => p.team === t);
        });

        return (
            <Box sx={{ mb: 4, mt: 2 }}>
                <Grid container spacing={2}>
                    {availableTeams.map((teamId) => (
                        <Grid item xs={12} sm={6} key={teamId}>
                            <Card
                                sx={{
                                    p: 2,
                                    bgcolor: `${getTeamColor(teamId)}22`,
                                    borderLeft: `5px solid ${getTeamColor(teamId)}`,
                                    height: "100%",
                                    position: "relative",
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography variant="h6" sx={{ color: getTeamColor(teamId), fontWeight: "bold" }}>
                                        {getTeamName(teamId)}
                                    </Typography>
                                    <Chip
                                        label={`Score: ${teamScores[teamId]?.total || 0}`}
                                        color={teamId === "team1" ? "error" : "primary"}
                                        sx={{ fontWeight: "bold" }}
                                    />
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                                    Players:
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1,
                                        "& > *": {
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                                transform: "translateY(-2px)",
                                            },
                                        },
                                    }}
                                >
                                    {teamPlayers[teamId]?.map((player) => (
                                        <Chip
                                            key={player.id}
                                            avatar={
                                                <Avatar
                                                    sx={{
                                                        bgcolor:
                                                            player.id === activePlayer
                                                                ? getTeamColor(teamId)
                                                                : "rgba(255,255,255,0.2)",
                                                    }}
                                                >
                                                    {player.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            }
                                            label={player.name}
                                            variant={player.id === activePlayer ? "filled" : "outlined"}
                                            color={teamId === "team1" ? "error" : "primary"}
                                            sx={{
                                                fontWeight: player.id === activePlayer ? "bold" : "normal",
                                                border: player.id === socketId ? "2px dashed white" : "none",
                                            }}
                                            icon={player.isLeader ? <StarIcon fontSize="small" /> : null}
                                        />
                                    ))}
                                </Box>

                                {activeTeam === teamId && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: -10,
                                            right: -10,
                                            bgcolor: getTeamColor(teamId),
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 32,
                                            height: 32,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                                        }}
                                    >
                                        <PlayArrowIcon />
                                    </Box>
                                )}
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    // Render the game area with buttons when playing
    const renderGameArea = () => {
        const isDrawingRound = currentRound === 2;
        const currentPlayerName = players.find((p) => p.id === activePlayer)?.name || "Player";

        return (
            <Box sx={{ textAlign: "center", mt: 3, mb: 4, position: "relative" }}>
                {/* Current turn indicator */}
                <Box
                    sx={{
                        textAlign: "center",
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: activeTeam ? `${getTeamColor(activeTeam)}22` : "transparent",
                        border: activeTeam ? `1px solid ${getTeamColor(activeTeam)}` : "none",
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: "bold",
                            color: activeTeam ? getTeamColor(activeTeam) : "white",
                        }}
                    >
                        {currentPlayerName}'s Turn
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        {getTeamName(activeTeam)}
                    </Typography>

                    {isMyTurn && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
                            <Typography variant="body1" sx={{ color: "white", mb: 2 }}>
                                {currentWord ? (
                                    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                                        {currentWord}
                                    </Typography>
                                ) : (
                                    "Your turn! Get a word to start."
                                )}
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                                {!currentWord && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => socket.emit("drawWord", { roomName: room })}
                                        startIcon={<PlayArrowIcon />}
                                        sx={{
                                            minWidth: "120px",
                                            py: 1.5,
                                            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        Get Word
                                    </Button>
                                )}

                                {currentWord && (
                                    <>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<SkipNextIcon />}
                                            onClick={handleSkipWord}
                                            sx={{
                                                minWidth: "120px",
                                                py: 1.5,
                                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                            }}
                                        >
                                            Skip
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={handleWordGuessed}
                                            sx={{
                                                minWidth: "120px",
                                                py: 1.5,
                                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                            }}
                                        >
                                            Done
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}

                    {!isMyTurn && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
                            <Typography sx={{ color: "white" }}>
                                {isDrawingRound
                                    ? "Try to guess what they're drawing or acting out!"
                                    : "Listen carefully and guess the word!"}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* End turn button for leader */}
                {isLeader && !isMyTurn && turnActive && (
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handleEndTurn}
                            sx={{
                                minWidth: "120px",
                                py: 1,
                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                            }}
                        >
                            End Turn (Leader)
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    // Render the timer
    const renderTimer = () => {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 1 }}>
                <Chip
                    icon={<TimerIcon />}
                    label={`${timer} seconds`}
                    color={timer <= 10 ? "error" : "primary"}
                    variant="outlined"
                    sx={{
                        fontSize: "1.2rem",
                        p: 2,
                        height: "auto",
                        borderWidth: timer <= 10 ? 2 : 1,
                    }}
                />
            </Box>
        );
    };

    // Render scores
    const renderScores = () => {
        return (
            <Card sx={{ mt: 3, bgcolor: "#1e1e1e", color: "white", borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Scores
                    </Typography>
                    <Grid container spacing={2}>
                        {Object.entries(teamScores).map(([teamId, scoreData]) => (
                            <Grid item xs={6} md={3} key={teamId}>
                                <Card
                                    sx={{
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        color: "white",
                                        border: `2px solid ${getTeamColor(teamId)}`,
                                        borderRadius: 2,
                                    }}
                                >
                                    <CardContent sx={{ p: 1 }}>
                                        <Typography variant="body2" color={getTeamColor(teamId)} fontWeight="bold">
                                            {getTeamName(teamId)}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                                            {scoreData.total}
                                        </Typography>
                                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                                            {scoreData.roundScores.map((score, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={score}
                                                    size="small"
                                                    sx={{
                                                        mx: 0.5,
                                                        opacity: idx > currentRound ? 0.5 : 1,
                                                        bgcolor:
                                                            idx === currentRound
                                                                ? getTeamColor(teamId)
                                                                : "rgba(255,255,255,0.1)",
                                                        color: idx === currentRound ? "black" : "white",
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    // Render guessed words after a turn ends
    const renderGuessedWords = () => {
        if (!guessedWords || guessedWords.length === 0) return null;

        return (
            <Card sx={{ mt: 3, bgcolor: "#1e1e1e", color: "white", borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Last Turn: {guessedWords.length} words guessed
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {guessedWords.map((word, idx) => (
                            <Chip key={idx} label={word} color="success" variant="outlined" />
                        ))}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    // Render action button based on game state
    const renderActionButton = () => {
        // Only show action buttons to the leader
        if (!isLeader) return null;

        if (gameState === "waiting") {
            return (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartRound}
                    sx={{ mt: 3, px: 4, py: 1, fontSize: "1.1rem" }}
                    startIcon={<StarIcon />}
                >
                    Start Round (Leader)
                </Button>
            );
        }

        if (gameState === "turnEnded" && activeTeam && !roundEndDialog && !gameEndDialog) {
            return (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartRound}
                    sx={{
                        mt: 3,
                        px: 4,
                        py: 1,
                        fontSize: "1.1rem",
                        bgcolor: getTeamColor(activeTeam),
                        "&:hover": {
                            bgcolor: getTeamColor(activeTeam),
                            opacity: 0.9,
                        },
                    }}
                    startIcon={<StarIcon />}
                >
                    {getTeamName(activeTeam)}'s Turn - Start (Leader)
                </Button>
            );
        }

        return null;
    };

    // Round end dialog
    const renderRoundEndDialog = () => {
        if (!rounds[currentRound]) return null;

        return (
            <Dialog open={roundEndDialog} onClose={() => setRoundEndDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: "#1e1e1e", color: "white" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CelebrationIcon sx={{ mr: 1 }} />
                        Round {currentRound} - {rounds[currentRound]?.name}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1e1e1e", color: "white", pt: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {rounds[currentRound]?.description}
                    </Typography>

                    <Grid container spacing={2}>
                        {Object.entries(teamScores).map(([teamId, scoreData]) => (
                            <Grid item xs={6} key={teamId}>
                                <Card
                                    sx={{
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        color: "white",
                                        border: `2px solid ${getTeamColor(teamId)}`,
                                        borderRadius: 2,
                                    }}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="body1" color={getTeamColor(teamId)} fontWeight="bold">
                                            {getTeamName(teamId)}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                            {scoreData.total} points
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            This round: +{scoreData.roundScores[currentRound - 1] || 0}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#1e1e1e", color: "white" }}>
                    <Button
                        onClick={() => {
                            setRoundEndDialog(false);
                            setGameState("waiting");
                        }}
                        variant="contained"
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Game end dialog
    const renderGameEndDialog = () => {
        return (
            <Dialog open={gameEndDialog} onClose={() => setGameEndDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: "#1e1e1e", color: "white" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmojiEventsIcon sx={{ mr: 1, color: "gold" }} />
                        Game Completed!
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1e1e1e", color: "white", pt: 2 }}>
                    {winner !== "tie" && (
                        <Typography variant="h5" sx={{ mb: 3, color: getTeamColor(winner) }}>
                            {getTeamName(winner)} wins!
                        </Typography>
                    )}

                    {winner === "tie" && (
                        <Typography variant="h5" sx={{ mb: 3 }}>
                            It's a tie!
                        </Typography>
                    )}

                    <Grid container spacing={2}>
                        {Object.entries(teamScores)
                            .sort((a, b) => b[1].total - a[1].total)
                            .map(([teamId, scoreData]) => (
                                <Grid item xs={6} key={teamId}>
                                    <Card
                                        sx={{
                                            bgcolor: "rgba(0,0,0,0.3)",
                                            color: "white",
                                            border: `2px solid ${getTeamColor(teamId)}`,
                                            borderRadius: 2,
                                            boxShadow: winner === teamId ? "0 0 15px gold" : "none",
                                        }}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Typography variant="body1" color={getTeamColor(teamId)} fontWeight="bold">
                                                {getTeamName(teamId)}
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                                {scoreData.total} points
                                            </Typography>
                                            <Divider sx={{ my: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                                            <Typography variant="body2">Round 1: {scoreData.roundScores[0] || 0}</Typography>
                                            <Typography variant="body2">Round 2: {scoreData.roundScores[1] || 0}</Typography>
                                            <Typography variant="body2">Round 3: {scoreData.roundScores[2] || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#1e1e1e", color: "white" }}>
                    <Button
                        onClick={() => {
                            setGameEndDialog(false);
                            navigate(`/room/${room}`); // Navigate back to room after game ends
                        }}
                        variant="contained"
                    >
                        Return to Room
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Render synchronizing state
    const renderSynchronizing = () => {
        if (!synchronizing) return null;

        return (
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.7)",
                    zIndex: 10,
                }}
            >
                <CircularProgress color="primary" size={60} />
                <Typography variant="h6" color="white" sx={{ mt: 2 }}>
                    Synchronizing Game State...
                </Typography>
            </Box>
        );
    };

    // Main render
    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: "#1e1e1e",
                color: "white",
                position: "relative",
            }}
        >
            {renderSynchronizing()}

            {/* Prominent round indicator */}
            <Box
                sx={{
                    bgcolor: "rgba(0,0,0,0.5)",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                {[0, 1, 2].map((roundIdx) => (
                    <Badge
                        key={roundIdx}
                        color={roundIdx === currentRound ? "primary" : "default"}
                        variant="dot"
                        invisible={roundIdx !== currentRound}
                    >
                        <Chip
                            icon={getRoundIcon(roundIdx)}
                            label={rounds[roundIdx]?.name || `Round ${roundIdx + 1}`}
                            color={roundIdx === currentRound ? "primary" : "default"}
                            variant={roundIdx === currentRound ? "filled" : "outlined"}
                            sx={{
                                px: 1,
                                fontWeight: "bold",
                                opacity: roundIdx < currentRound ? 0.6 : 1,
                            }}
                        />
                    </Badge>
                ))}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Room: {room}
                </Typography>
                {isLeader && (
                    <Tooltip title="You are the Room Leader">
                        <Chip icon={<StarIcon />} label="Room Leader" color="secondary" sx={{ mr: 2, fontWeight: "bold" }} />
                    </Tooltip>
                )}
                <Chip
                    label={rounds[currentRound]?.description || "Getting Ready"}
                    variant="outlined"
                    icon={<TimerIcon sx={{ color: "#64b5f6 !important" }} />}
                    sx={{ fontWeight: "bold", color: "#64b5f6", borderColor: "#64b5f6" }}
                />
            </Box>

            {error && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                </Box>
            )}

            {/* If not leader, show message that you're waiting for leader to start */}
            {!isLeader && gameState === "waiting" && !turnActive && (
                <Box sx={{ mt: 3, mb: 3, textAlign: "center" }}>
                    <Card sx={{ bgcolor: "rgba(0,0,0,0.3)", p: 2, maxWidth: 400, mx: "auto" }}>
                        <Typography variant="body1" color="rgba(255,255,255,0.7)">
                            Waiting for the room leader to start the round...
                        </Typography>
                    </Card>
                </Box>
            )}

            {/* Game info card */}
            <Card
                sx={{
                    my: 2,
                    bgcolor: team ? getTeamColor(team) + "22" : "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    boxShadow: 1,
                    border: team ? `1px solid ${getTeamColor(team)}` : `1px solid rgba(255,255,255,0.1)`,
                }}
            >
                <CardContent sx={{ p: 2 }}>
                    <Grid container alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar
                                    sx={{
                                        bgcolor: getTeamColor(team),
                                        color: "white",
                                        mr: 1,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {playerName?.charAt(0)?.toUpperCase() || "?"}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                        You: {playerName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: getTeamColor(team) }}>
                                        {getTeamName(team)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                            {gameState === "playing" && renderTimer()}
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
                            {activeTeam && activePlayer && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: { xs: "flex-start", md: "flex-end" },
                                    }}
                                >
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Active Team:
                                    </Typography>
                                    <Chip
                                        label={getTeamName(activeTeam)}
                                        sx={{
                                            bgcolor: getTeamColor(activeTeam),
                                            color: "white",
                                            fontWeight: "bold",
                                            mb: 1,
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Current Player:
                                    </Typography>
                                    <Chip
                                        label={players.find((p) => p.id === activePlayer)?.name || "Player"}
                                        variant="outlined"
                                        sx={{
                                            borderColor: getTeamColor(activeTeam),
                                            color: getTeamColor(activeTeam),
                                        }}
                                    />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Players by teams - collapsible section */}
            <Accordion
                sx={{
                    mb: 3,
                    bgcolor: "rgba(0,0,0,0.3)",
                    color: "white",
                    "&:before": {
                        display: "none",
                    },
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}>
                    <Typography>View All Players</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {/* Get teams from the player data */}
                        {(() => {
                            // Create a map of teams to player arrays
                            const teamMap = {};
                            players.forEach((player) => {
                                if (player.team) {
                                    if (!teamMap[player.team]) {
                                        teamMap[player.team] = [];
                                    }
                                    teamMap[player.team].push(player);
                                }
                            });

                            // Render each team
                            return Object.entries(teamMap).map(([teamId, teamPlayers]) => (
                                <Grid item xs={12} sm={6} md={3} key={teamId}>
                                    <Box
                                        sx={{
                                            bgcolor: "rgba(0,0,0,0.2)",
                                            p: 1,
                                            borderRadius: 1,
                                            border: `1px solid ${getTeamColor(teamId)}`,
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: getTeamColor(teamId),
                                                fontWeight: "bold",
                                                mb: 1,
                                            }}
                                        >
                                            {getTeamName(teamId)}
                                        </Typography>
                                        <Divider sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.1)" }} />
                                        {teamPlayers.map((player) => (
                                            <Box
                                                key={player.id}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    mb: 0.5,
                                                    p: 0.5,
                                                    borderRadius: 1,
                                                    bgcolor:
                                                        player.id === activePlayer
                                                            ? `${getTeamColor(teamId)}22`
                                                            : "transparent",
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        fontSize: "0.8rem",
                                                        mr: 1,
                                                        bgcolor:
                                                            player.id === activePlayer
                                                                ? getTeamColor(teamId)
                                                                : "rgba(255,255,255,0.2)",
                                                    }}
                                                >
                                                    {player.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {player.name} {player.id === socketId ? "(You)" : ""}
                                                </Typography>
                                                {player.isLeader && (
                                                    <StarIcon sx={{ ml: 0.5, fontSize: "0.8rem", color: "gold" }} />
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                            ));
                        })()}
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Show team scores and player list */}
            {players.length > 0 && renderTeamInfo()}

            {/* Main game area with hat and buttons */}
            {["playing", "roundStarting"].includes(gameState) && renderGameArea()}

            {/* Scores */}
            {Object.keys(teamScores).length > 0 && renderScores()}

            {/* Last turn guessed words */}
            {gameState === "turnEnded" && renderGuessedWords()}

            {/* Action button based on state */}
            <Box sx={{ textAlign: "center" }}>{renderActionButton()}</Box>

            {/* Round end dialog */}
            {renderRoundEndDialog()}

            {/* Game end dialog */}
            {renderGameEndDialog()}
        </Paper>
    );
}

export default GamePlay;
