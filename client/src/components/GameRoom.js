import React, { useState, useEffect } from "react";
import { Box, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RoomHeader from "./room/RoomHeader";
import PlayerList from "./room/PlayerList";
import GameControls from "./room/GameControls";
import WordSubmission from "./WordSubmission";
import GamePlay from "./GamePlay";

function GameRoom({ room, socket, playerName, onLeaveRoom }) {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const [playerCount, setPlayerCount] = useState(0);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState({ "Team 1": [], "Team 2": [] });
    const [teamScores, setTeamScores] = useState({ "Team 1": 0, "Team 2": 0 });
    const [activeTeam, setActiveTeam] = useState(null);
    const [activePlayer, setActivePlayer] = useState(null);
    const [turnActive, setTurnActive] = useState(false);
    const [currentWord, setCurrentWord] = useState(null);
    const [hatCount, setHatCount] = useState(0);
    const [allWordsSubmitted, setAllWordsSubmitted] = useState(false);
    const [gameState, setGameState] = useState("waiting");

    useEffect(() => {
        if (players && Array.isArray(players)) {
            setPlayerCount(players.length);
        }
    }, [players]);

    useEffect(() => {
        const handleError = (errorMessage) => {
            console.error("GameRoom Error Listener:", errorMessage);
            setError(errorMessage);
            setIsStarting(false);
            setTimeout(() => setError(null), 5000);
        };

        socket.on("error", handleError);
        return () => socket.off("error", handleError);
    }, [socket]);

    useEffect(() => {
        socket.on("gameStateUpdate", (state) => {
            setPlayers(state.players);
            setTeams(state.teams);
            setTeamScores(state.teamScores);
            setActiveTeam(state.activeTeam);
            setActivePlayer(state.activePlayer);
            setTurnActive(state.turnActive);
            setCurrentWord(state.currentWord);
            setHatCount(state.hatCount);
            setAllWordsSubmitted(state.allWordsSubmitted);
            setGameState(state.gameState);
        });

        socket.on("gameStarted", () => {
            setGameState("wordSubmission");
        });

        socket.on("allWordsSubmitted", () => {
            setAllWordsSubmitted(true);
            setGameState("playing");
        });

        return () => {
            socket.off("gameStateUpdate");
            socket.off("gameStarted");
            socket.off("allWordsSubmitted");
        };
    }, [socket]);

    const handleStartGame = () => {
        if (canStartGame) {
            setIsStarting(true);
            socket.emit("startGame", { roomName: room });
            setTimeout(() => setIsStarting(false), 3000);
        }
    };

    const canStartGame = playerCount >= 2 && gameState === "waiting";

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", pb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 2, bgcolor: "#1e1e1e" }}>
                <RoomHeader roomName={room} gameState={gameState} />

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <PlayerList
                    players={players}
                    socket={socket}
                    gameState={gameState}
                    playerCount={playerCount}
                    canStart={canStartGame}
                />

                <GameControls
                    gameState={gameState}
                    canStart={canStartGame}
                    isStarting={isStarting}
                    onStartGame={handleStartGame}
                    onLeaveRoom={onLeaveRoom}
                />

                {gameState === "wordSubmission" && <WordSubmission roomName={room} players={players} teams={teams} />}

                {gameState === "playing" && (
                    <GamePlay
                        roomName={room}
                        players={players}
                        teams={teams}
                        teamScores={teamScores}
                        activeTeam={activeTeam}
                        activePlayer={activePlayer}
                        turnActive={turnActive}
                        currentWord={currentWord}
                        hatCount={hatCount}
                    />
                )}
            </Paper>
        </Box>
    );
}

export default GameRoom;
