'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Player, Team, Word, Room } from '@/lib/types';
import WordSubmission from '@/components/WordSubmission';
import TeamFormation from '@/components/TeamFormation';
import GamePlay from '@/components/GamePlay';
import GameResults from '@/components/GameResults';

export default function RoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.id as string;
    const roomName = searchParams.get('name') || 'Shapka Room';

    const [playerId, setPlayerId] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [isRoomOwner, setIsRoomOwner] = useState<boolean>(false);
    const [gameState, setGameState] = useState<'joining' | 'waiting' | 'word-submission' | 'team-formation' | 'playing' | 'results'>('joining');
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [words, setWords] = useState<Word[]>([]);
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
    const [submittedWords, setSubmittedWords] = useState(false);

    // Simulating room connection
    useEffect(() => {
        // Get player info from localStorage
        const storedPlayerId = localStorage.getItem('playerId');
        const storedPlayerName = localStorage.getItem('playerName');

        if (storedPlayerId && storedPlayerName) {
            setPlayerId(storedPlayerId);
            setPlayerName(storedPlayerName);

            // In a real implementation, we would make a server call to join the room
            // And the server would tell us if we're the room owner

            // For demonstration, we'll use local storage to determine if we're the room owner
            // This simulates checking with the server
            const roomOwner = localStorage.getItem(`room-${roomId}-owner`);

            if (!roomOwner) {
                // First player to join is the room owner
                localStorage.setItem(`room-${roomId}-owner`, storedPlayerId);
                setIsRoomOwner(true);
                setGameState('team-formation');
            } else if (roomOwner === storedPlayerId) {
                // We're returning to a room we created
                setIsRoomOwner(true);

                // Load the current game state if available
                const savedGameState = localStorage.getItem(`room-${roomId}-gameState`);
                if (savedGameState) {
                    setGameState(savedGameState as any);
                } else {
                    setGameState('team-formation');
                }
            } else {
                // We're joining someone else's room
                const savedGameState = localStorage.getItem(`room-${roomId}-gameState`);
                setGameState(savedGameState as any || 'waiting');
            }

            // Load existing game data from localStorage
            const storedPlayers = JSON.parse(localStorage.getItem(`room-${roomId}-players`) || '[]');
            setPlayers(storedPlayers);

            const storedTeams = JSON.parse(localStorage.getItem(`room-${roomId}-teams`) || '[]');
            setTeams(storedTeams);

            const storedWords = JSON.parse(localStorage.getItem(`room-${roomId}-words`) || '[]');
            setWords(storedWords);

            // Check if current player has submitted words
            const hasSubmitted = storedWords.some((word: Word) => word.playerId === storedPlayerId);
            setSubmittedWords(hasSubmitted);

            // Load round info
            const savedRound = localStorage.getItem(`room-${roomId}-round`);
            if (savedRound) {
                setCurrentRound(parseInt(savedRound));
            }

            // Load team index
            const savedTeamIndex = localStorage.getItem(`room-${roomId}-teamIndex`);
            if (savedTeamIndex) {
                setCurrentTeamIndex(parseInt(savedTeamIndex));
            }

            // Load player index
            const savedPlayerIndex = localStorage.getItem(`room-${roomId}-playerIndex`);
            if (savedPlayerIndex) {
                setCurrentPlayerIndex(parseInt(savedPlayerIndex));
            }

            const newPlayer: Player = {
                id: storedPlayerId,
                name: storedPlayerName,
                teamId: ''
            };

            // Add player to the room if they don't exist yet
            setPlayers(prevPlayers => {
                // Check if player already exists
                if (prevPlayers.some(p => p.id === storedPlayerId)) {
                    return prevPlayers;
                }

                // Store players in localStorage to simulate server
                const existingPlayers = JSON.parse(localStorage.getItem(`room-${roomId}-players`) || '[]');
                // Make sure player doesn't already exist in localStorage
                if (!existingPlayers.some((p: Player) => p.id === storedPlayerId)) {
                    const updatedPlayers = [...existingPlayers, newPlayer];
                    localStorage.setItem(`room-${roomId}-players`, JSON.stringify(updatedPlayers));
                    return [...prevPlayers, newPlayer];
                }

                return prevPlayers;
            });
        }

        // Poll for new players (simulating websocket)
        const playerPoll = setInterval(() => {
            const storedPlayers = JSON.parse(localStorage.getItem(`room-${roomId}-players`) || '[]');

            // Deduplicate players before updating state
            const uniquePlayers = storedPlayers.filter((player: Player, index: number, self: Player[]) =>
                self.findIndex((p: Player) => p.id === player.id) === index
            );

            // Only update if there's a change and no duplicates
            if (JSON.stringify(uniquePlayers) !== JSON.stringify(players)) {
                localStorage.setItem(`room-${roomId}-players`, JSON.stringify(uniquePlayers));
                setPlayers(uniquePlayers);
            }

            // Get current game state
            const gameStateFromStorage = localStorage.getItem(`room-${roomId}-gameState`);

            // Special handling for word submission phase
            if (gameStateFromStorage === 'word-submission' || gameState === 'word-submission' || gameState === 'waiting') {
                const storedWords = JSON.parse(localStorage.getItem(`room-${roomId}-words`) || '[]') as Word[];
                const storedTeams = JSON.parse(localStorage.getItem(`room-${roomId}-teams`) || '[]') as Team[];
                const teamPlayers = storedTeams.flatMap(team => team.players);

                // Check if all players have submitted words
                const allSubmitted = teamPlayers.every(player =>
                    storedWords.some(word => word.playerId === player.id)
                );

                // If all players have submitted and we're not already playing, transition to playing state
                if (allSubmitted && gameStateFromStorage !== 'playing' && teamPlayers.length > 0) {
                    if (isRoomOwner) {
                        localStorage.setItem(`room-${roomId}-gameState`, 'playing');
                        setGameState('playing');
                    }
                }
            }
            // Update game state for non-owners if it has changed
            else if (!isRoomOwner && gameStateFromStorage && gameStateFromStorage !== gameState) {
                setGameState(gameStateFromStorage as any);

                // Also refresh other game data when state changes
                const storedTeams = JSON.parse(localStorage.getItem(`room-${roomId}-teams`) || '[]');
                setTeams(storedTeams);

                const storedWords = JSON.parse(localStorage.getItem(`room-${roomId}-words`) || '[]');
                setWords(storedWords);

                // Check and update round, team, and player indices
                const savedRound = localStorage.getItem(`room-${roomId}-round`);
                if (savedRound) {
                    setCurrentRound(parseInt(savedRound));
                }

                const savedTeamIndex = localStorage.getItem(`room-${roomId}-teamIndex`);
                if (savedTeamIndex) {
                    setCurrentTeamIndex(parseInt(savedTeamIndex));
                }

                const savedPlayerIndex = localStorage.getItem(`room-${roomId}-playerIndex`);
                if (savedPlayerIndex) {
                    setCurrentPlayerIndex(parseInt(savedPlayerIndex));
                }
            }
        }, 2000);

        return () => {
            clearInterval(playerPoll);
        };
    }, [roomId, gameState, isRoomOwner]);

    // Handler for team formation
    const handleTeamsFormed = (formedTeams: Team[]) => {
        setTeams(formedTeams);

        // Store teams in localStorage (simulating server)
        localStorage.setItem(`room-${roomId}-teams`, JSON.stringify(formedTeams));

        // Update game state to word submission
        localStorage.setItem(`room-${roomId}-gameState`, 'word-submission');
        setGameState('word-submission');
    };

    // Handler for word submission
    const handleWordSubmission = (submittedWords: string[]) => {
        // Convert words to Word objects with guaranteed unique IDs
        const wordObjects: Word[] = submittedWords.map((text, index) => ({
            id: `${playerId}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: text,
            playerId: playerId,
            used: false
        }));

        // Add words to the game
        setWords(prevWords => {
            // First check if player already submitted words
            const existingPlayerWords = prevWords.filter(w => w.playerId === playerId);
            if (existingPlayerWords.length > 0) {
                // Replace player's words instead of adding
                return [...prevWords.filter(w => w.playerId !== playerId), ...wordObjects];
            }
            return [...prevWords, ...wordObjects];
        });

        // Mark that this player has submitted words
        setSubmittedWords(true);

        // Store words in localStorage (simulating server)
        const existingWords = JSON.parse(localStorage.getItem(`room-${roomId}-words`) || '[]');
        const filteredWords = existingWords.filter((w: Word) => w.playerId !== playerId);
        const updatedWords = [...filteredWords, ...wordObjects];
        localStorage.setItem(`room-${roomId}-words`, JSON.stringify(updatedWords));

        // Show waiting screen after submitting
        setGameState('waiting');

        // Check if all players have submitted
        const storedTeams = JSON.parse(localStorage.getItem(`room-${roomId}-teams`) || '[]') as Team[];
        const teamPlayers = storedTeams.flatMap(team => team.players);
        const allSubmitted = teamPlayers.every(player =>
            [...updatedWords].some(word => word.playerId === player.id)
        );

        // If all players have submitted and we're the room owner, start the game
        if (allSubmitted && isRoomOwner && teamPlayers.length > 0) {
            localStorage.setItem(`room-${roomId}-gameState`, 'playing');
            setGameState('playing');
        }
    };

    // Handler to start the game after words are submitted
    const handleStartGame = () => {
        localStorage.setItem(`room-${roomId}-gameState`, 'playing');
        setGameState('playing');
    };

    // Handler for word completion during gameplay
    const handleWordComplete = (wordId: string, skipped: boolean) => {
        // Mark word as used
        const updatedWords = words.map(word =>
            word.id === wordId ? { ...word, used: true } : word
        );
        setWords(updatedWords);

        // Store updated words in localStorage
        localStorage.setItem(`room-${roomId}-words`, JSON.stringify(updatedWords));

        // If not skipped, increment the team's score
        if (!skipped) {
            const updatedTeams = teams.map((team, index) =>
                index === currentTeamIndex ? { ...team, score: team.score + 1 } : team
            );
            setTeams(updatedTeams);

            // Store updated teams in localStorage
            localStorage.setItem(`room-${roomId}-teams`, JSON.stringify(updatedTeams));
        }

        // Move to next player
        moveToNextTurn();
    };

    // Function to move to the next turn
    const moveToNextTurn = () => {
        // Move to the next team
        const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        setCurrentTeamIndex(nextTeamIndex);

        // Store in localStorage
        localStorage.setItem(`room-${roomId}-teamIndex`, nextTeamIndex.toString());

        // If we've gone through all teams, move to the next player
        if (nextTeamIndex === 0) {
            // Get current team
            const currentTeam = teams[currentTeamIndex];
            // Move to next player in the team
            const nextPlayerIndex = (currentPlayerIndex + 1) % currentTeam.players.length;
            setCurrentPlayerIndex(nextPlayerIndex);

            // Store in localStorage
            localStorage.setItem(`room-${roomId}-playerIndex`, nextPlayerIndex.toString());
        }
    };

    // Handler for round completion
    const handleRoundComplete = () => {
        // Reset all words to unused for the next round
        const resetWords = words.map(word => ({ ...word, used: false }));
        setWords(resetWords);

        // Store updated words in localStorage
        localStorage.setItem(`room-${roomId}-words`, JSON.stringify(resetWords));

        // Move to the next round
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);

        // Store round in localStorage
        localStorage.setItem(`room-${roomId}-round`, nextRound.toString());

        // Reset turn to first team, first player
        setCurrentTeamIndex(0);
        localStorage.setItem(`room-${roomId}-teamIndex`, '0');

        setCurrentPlayerIndex(0);
        localStorage.setItem(`room-${roomId}-playerIndex`, '0');
    };

    // Handler for game completion
    const handleGameComplete = () => {
        // Store final scores for results page
        localStorage.setItem(`room-${roomId}-finalTeams`, JSON.stringify(teams));

        // Update game state
        localStorage.setItem(`room-${roomId}-gameState`, 'results');
        setGameState('results');
    };

    // Render different components based on game state
    const renderGameState = () => {
        switch (gameState) {
            case 'joining':
                return (
                    <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Joining Room...</h2>
                        <p className="text-gray-700 font-medium">Please wait while we connect you to the room.</p>
                    </div>
                );

            case 'waiting':
                // Show different messages based on the previous state
                let waitingMessage = 'Waiting for the room owner to advance the game...';
                let showStartButton = false;

                if (submittedWords) {
                    waitingMessage = 'Your words have been submitted! Waiting for other players to submit their words.';

                    // Check if all team players have submitted words
                    if (isRoomOwner) {
                        // Get all players in teams
                        const teamPlayers = teams.flatMap(team => team.players);

                        // Check if each player has submitted words
                        const storedWords = JSON.parse(localStorage.getItem(`room-${roomId}-words`) || '[]') as Word[];
                        let allSubmitted = true;
                        let pendingPlayers: string[] = [];

                        for (const player of teamPlayers) {
                            const hasSubmitted = storedWords.some(word => word.playerId === player.id);
                            if (!hasSubmitted) {
                                allSubmitted = false;
                                pendingPlayers.push(player.name);
                            }
                        }

                        if (allSubmitted && teamPlayers.length > 0) {
                            waitingMessage = 'All players have submitted their words!';
                            showStartButton = true;
                        } else if (pendingPlayers.length > 0) {
                            waitingMessage = `Waiting for ${pendingPlayers.join(', ')} to submit words...`;
                        } else {
                            waitingMessage = 'Waiting for all players to submit their words...';
                        }
                    }
                } else {
                    // Check if we're in team formation or word submission phase
                    const gameStateFromStorage = localStorage.getItem(`room-${roomId}-gameState`);
                    if (gameStateFromStorage === 'team-formation') {
                        waitingMessage = 'Waiting for the room owner to organize teams...';
                    } else if (gameStateFromStorage === 'word-submission') {
                        waitingMessage = 'Teams are formed! Please submit your words.';
                        // If we're in word submission phase but haven't submitted yet, show the word submission form
                        return (
                            <WordSubmission
                                playerId={playerId}
                                onSubmit={handleWordSubmission}
                            />
                        );
                    } else if (gameStateFromStorage === 'playing') {
                        waitingMessage = 'Game is about to start! Please wait...';
                    }
                }

                return (
                    <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Waiting for Next Step</h2>
                        <p className="text-gray-700 font-medium mb-4">{waitingMessage}</p>

                        {isRoomOwner && showStartButton ? (
                            <button
                                onClick={handleStartGame}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md transition-colors flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                </svg>
                                Start Game
                            </button>
                        ) : (
                            <div className="flex justify-center">
                                <div className="w-16 h-16 border-t-4 border-blue-700 border-solid rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                );

            case 'word-submission':
                return (
                    <WordSubmission
                        playerId={playerId}
                        onSubmit={handleWordSubmission}
                    />
                );

            case 'team-formation':
                return (
                    <TeamFormation
                        players={players}
                        onTeamsFormed={handleTeamsFormed}
                        roomOwner={isRoomOwner}
                        playerId={playerId}
                    />
                );

            case 'playing':
                return (
                    <GamePlay
                        round={currentRound}
                        teams={teams}
                        words={words}
                        currentTeamIndex={currentTeamIndex}
                        currentPlayerIndex={currentPlayerIndex}
                        playerId={playerId}
                        onWordComplete={handleWordComplete}
                        onRoundComplete={handleRoundComplete}
                        onGameComplete={handleGameComplete}
                    />
                );

            case 'results':
                return (
                    <GameResults
                        teams={teams}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-4 h-screen flex flex-col">
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Shapka</h1>
                <div className="flex justify-center space-x-3 text-sm">
                    <p className="text-gray-700">Room ID: <span className="font-medium">{roomId}</span></p>
                    {playerName && <p className="text-gray-700">Playing as: <span className="font-medium">{playerName}</span></p>}
                </div>
            </header>

            <div className="flex-1">
                {renderGameState()}
            </div>
        </div>
    );
}