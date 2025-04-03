import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { Box, Container } from "@mui/material";
import io from "socket.io-client";
import Home from "./components/Home";
import GameRoom from "./components/GameRoom";
import WordSubmission from "./components/WordSubmission";

// Create socket connection
const socket = io("http://localhost:5000");

function App() {
    const [room, setRoom] = useState(localStorage.getItem("roomName") || null);
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [playerName, setPlayerName] = useState(localStorage.getItem("playerName") || "");
    const [gameState, setGameState] = useState("waiting");
    const [team, setTeam] = useState(null);
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId") || null);
    const navigate = useNavigate();

    // Log socket connection status
    useEffect(() => {
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            // Attempt to rejoin if we have session info upon reconnection
            const storedSessionId = localStorage.getItem("sessionId");
            const storedPlayerName = localStorage.getItem("playerName");
            const storedRoomName = localStorage.getItem("roomName");
            if (storedSessionId && storedPlayerName && storedRoomName) {
                console.log("Re-emitting checkSession on connect");
                socket.emit("checkSession", { sessionId: storedSessionId, playerName: storedPlayerName });
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            // Optionally clear some state or show a disconnected message
            // setError("Connection lost. Attempting to reconnect...");
        });

        socket.on("connect_error", (err) => {
            console.error("Connection error:", err);
            setError("Server connection error. Please try again.");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("connect_error");
        };
    }, []);

    useEffect(() => {
        // Check for existing session on load (only if not already connected and checked)
        if (!socket.connected) {
            const storedSessionId = localStorage.getItem("sessionId");
            const storedPlayerName = localStorage.getItem("playerName");
            const storedRoomName = localStorage.getItem("roomName");

            console.log("Initial check for stored session:", { storedSessionId, storedPlayerName, storedRoomName });

            if (storedSessionId && storedPlayerName && storedRoomName) {
                setSessionId(storedSessionId);
                setPlayerName(storedPlayerName);
                setRoom(storedRoomName);
                // Emit checkSession - the connect handler will also do this if it connects later
                socket.emit("checkSession", { sessionId: storedSessionId, playerName: storedPlayerName });
            }
        }

        // Player management events
        socket.on("playerJoined", (updatedPlayers) => {
            console.log("Players joined event:", updatedPlayers);
            setPlayers(updatedPlayers);
        });

        socket.on("playerLeft", (updatedPlayers) => {
            console.log("Players left event:", updatedPlayers);
            setPlayers(updatedPlayers);
        });

        socket.on("playerDisconnected", (updatedPlayers) => {
            console.log("Player disconnected event:", updatedPlayers);
            // Add visual indication for disconnected players later if needed
            setPlayers(updatedPlayers);
        });

        socket.on("error", (errorMessage) => {
            console.error("Error event:", errorMessage);
            setError(errorMessage);
            // Clear error after some time
            setTimeout(() => setError(null), 5000);
        });

        socket.on("sessionInvalid", () => {
            console.log("Session invalid, clearing data and navigating to home");
            // Clear invalid session data
            localStorage.removeItem("sessionId");
            localStorage.removeItem("playerName");
            localStorage.removeItem("roomName");
            setSessionId(null);
            setRoom(null);
            setPlayers([]);
            setGameState("waiting");
            setTeam(null);
            setError(null); // Clear any previous errors
            navigate("/");
        });

        // Updated roomJoined handler (no leader)
        socket.on("roomJoined", ({ roomName, sessionId }) => {
            console.log("Room joined event:", { roomName, sessionId });
            setRoom(roomName);
            setSessionId(sessionId);
            setError(null);
            setGameState("waiting"); // Reset game state on join

            // Store session info in localStorage
            localStorage.setItem("sessionId", sessionId);
            localStorage.setItem("playerName", playerName);
            localStorage.setItem("roomName", roomName);

            navigate(`/room/${roomName}`);
        });

        // Game flow events
        socket.on("gameStarted", ({ teams, players }) => {
            console.log("Game started event received:", { teams, players });

            const currentRoomName = localStorage.getItem("roomName"); // Use localStorage as source of truth here
            if (!currentRoomName) {
                console.error("Cannot navigate to words page: Room name missing in localStorage.");
                navigate("/");
                return;
            }

            // Update state immediately
            setPlayers(players);
            setGameState("wordSubmission");

            const currentPlayer = players.find((p) => p.id === socket.id);
            if (currentPlayer) {
                console.log("Current player found for team assignment:", currentPlayer);
                setTeam(currentPlayer.team);
            } else {
                console.error("Could not find current player in the players list after game started event");
                // This is problematic, maybe force a refresh or error out?
                // For now, log it. Navigation might fail or show wrong team info.
            }

            // Navigate immediately after state updates
            console.log("Navigating to word submission page for room:", currentRoomName);
            navigate(`/room/${currentRoomName}/words`);
        });

        // Event when all players have submitted their words
        socket.on("allWordsSubmitted", ({ players, teams }) => {
            console.log("All words submitted event:", { players, teams });
            setGameState("playing");
            setPlayers(players);
            // TODO: Navigate to the actual gameplay screen
            console.log("TODO: Navigate to gameplay screen");
        });

        // Event for player submission feedback (optional)
        socket.on("playerSubmittedWords", ({ playerId }) => {
            console.log(`Player ${playerId} submitted their words.`);
            // Optionally update UI to show who has submitted
        });

        return () => {
            socket.off("playerJoined");
            socket.off("playerLeft");
            socket.off("playerDisconnected");
            socket.off("error");
            socket.off("roomJoined");
            socket.off("gameStarted");
            socket.off("allWordsSubmitted");
            socket.off("sessionInvalid");
            socket.off("playerSubmittedWords"); // Cleanup optional listener
        };
    }, [navigate, playerName, room]); // Keep dependencies

    const joinRoom = (roomName, name) => {
        console.log("Joining room attempt:", roomName, "Player:", name);
        // Clear previous error state on new join attempt
        setError(null);
        setPlayerName(name);
        socket.emit("joinRoom", { roomName, playerName: name });
    };

    const handleLeaveRoom = () => {
        console.log("Leaving room explicitly");
        const currentRoom = room || localStorage.getItem("roomName");
        if (currentRoom) {
            socket.emit("leaveRoom", currentRoom);
        }
        // Clear local storage and state regardless of whether socket was connected
        localStorage.removeItem("sessionId");
        localStorage.removeItem("playerName");
        localStorage.removeItem("roomName");
        setRoom(null);
        setSessionId(null);
        setPlayers([]);
        setGameState("waiting");
        setTeam(null);
        setError(null);
        navigate("/");
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Routes>
                    {/* Home route - only join room */}
                    <Route path="/" element={<Home onJoinRoom={joinRoom} error={error} />} />

                    {/* Main game room route - no leader prop */}
                    <Route
                        path="/room/:roomName"
                        element={
                            // Check localStorage as fallback for direct access/refresh
                            room || localStorage.getItem("roomName") ? (
                                <GameRoom
                                    room={room || localStorage.getItem("roomName")}
                                    players={players}
                                    socket={socket}
                                    playerName={playerName}
                                    gameState={gameState}
                                    // Removed isLeader prop
                                    onLeaveRoom={handleLeaveRoom}
                                />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                    {/* Word submission route */}
                    <Route
                        path="/room/:roomName/words"
                        element={
                            // Check localStorage as fallback for direct access/refresh
                            (room || localStorage.getItem("roomName")) && gameState === "wordSubmission" ? (
                                <WordSubmission
                                    room={room || localStorage.getItem("roomName")}
                                    players={players}
                                    socket={socket}
                                    playerName={playerName}
                                    team={team}
                                    onLeaveRoom={handleLeaveRoom}
                                />
                            ) : (
                                // If not in correct state/room, redirect to home or room page
                                <Navigate to={room ? `/room/${room}` : "/"} replace />
                            )
                        }
                    />
                </Routes>
            </Box>
        </Container>
    );
}

export default App;
