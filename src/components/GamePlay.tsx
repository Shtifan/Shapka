"use client";

import { useState, useEffect, useRef } from "react";
import { Team, Word, Player } from "../lib/types";

interface GamePlayProps {
    round: number;
    teams: Team[];
    words: Word[];
    currentTeamIndex: number;
    currentPlayerIndex: number;
    playerId: string;
    onWordComplete: (wordId: string, skipped: boolean) => void;
    onRoundComplete: () => void;
    onGameComplete: () => void;
}

export default function GamePlay({
    round,
    teams,
    words,
    currentTeamIndex,
    currentPlayerIndex,
    playerId,
    onWordComplete,
    onRoundComplete,
    onGameComplete,
}: GamePlayProps) {
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [roundTitle, setRoundTitle] = useState("");
    const [roundInstructions, setRoundInstructions] = useState("");
    const [remainingWords, setRemainingWords] = useState<Word[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Set up round info
    useEffect(() => {
        if (round === 1) {
            setRoundTitle("Round 1: Describe It");
            setRoundInstructions("Describe the word to your teammate using any words except the word itself.");
        } else if (round === 2) {
            setRoundTitle("Round 2: One Word Only");
            setRoundInstructions("Describe the word using ONLY ONE word.");
        } else {
            setRoundTitle("Round 3: Draw It");
            setRoundInstructions("Draw the word for your teammate to guess (no writing allowed).");
        }

        // Filter words that haven't been used yet
        setRemainingWords(words.filter((word) => !word.used));
    }, [round, words]);

    // Check if it's the current player's turn
    useEffect(() => {
        if (!teams || teams.length === 0) return;

        const currentTeam = teams[currentTeamIndex];
        if (!currentTeam || !currentTeam.players) return;

        const currentPlayer = currentTeam.players[currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === playerId);

        // Reset timer if it's a new turn
        if (currentPlayer?.id === playerId) {
            setTimeLeft(60);
            setCurrentWord(null);
        }
    }, [currentTeamIndex, currentPlayerIndex, teams, playerId]);

    // Set up timer
    useEffect(() => {
        if (isMyTurn && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current as NodeJS.Timeout);
                        // End turn
                        if (currentWord) {
                            onWordComplete(currentWord.id, true);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isMyTurn, timeLeft, currentWord, onWordComplete]);

    // Drawing functionality
    useEffect(() => {
        if (round !== 3 || !isMyTurn || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const startDrawing = (e: MouseEvent) => {
            setIsDrawing(true);
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setLastPosition({ x, y });
        };

        const draw = (e: MouseEvent) => {
            if (!isDrawing) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            context.beginPath();
            context.moveTo(lastPosition.x, lastPosition.y);
            context.lineTo(x, y);
            context.stroke();

            setLastPosition({ x, y });
        };

        const stopDrawing = () => {
            setIsDrawing(false);
        };

        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mouseout", stopDrawing);

        return () => {
            canvas.removeEventListener("mousedown", startDrawing);
            canvas.removeEventListener("mousemove", draw);
            canvas.removeEventListener("mouseup", stopDrawing);
            canvas.removeEventListener("mouseout", stopDrawing);
        };
    }, [round, isMyTurn, isDrawing, lastPosition]);

    // Clear canvas when getting a new word
    useEffect(() => {
        if (round === 3 && currentWord && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.lineCap = "round";
            }
        }
    }, [round, currentWord]);

    // Check if round or game is complete
    useEffect(() => {
        if (remainingWords.length === 0) {
            if (round === 3) {
                onGameComplete();
            } else {
                onRoundComplete();
            }
        }
    }, [remainingWords, round, onRoundComplete, onGameComplete]);

    const handleGetWord = () => {
        if (!isMyTurn || remainingWords.length === 0) return;

        // Get a random word
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const word = remainingWords[randomIndex];
        setCurrentWord(word);

        // Remove from remaining words
        setRemainingWords((prev) => prev.filter((w) => w.id !== word.id));
    };

    const handleSkipWord = () => {
        if (!isMyTurn || !currentWord) return;

        onWordComplete(currentWord.id, true);
        setCurrentWord(null);
    };

    const handleDoneWord = () => {
        if (!isMyTurn || !currentWord) return;

        onWordComplete(currentWord.id, false);
        setCurrentWord(null);
    };

    const renderPlayerTurn = () => {
        if (!teams || teams.length === 0) return null;

        const currentTeam = teams[currentTeamIndex];
        if (!currentTeam || !currentTeam.players) return null;

        const currentPlayer = currentTeam.players[currentPlayerIndex];
        if (!currentPlayer) return null;

        return (
            <div className="text-center p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900">
                    Current Turn: <span className="text-blue-700">{currentTeam.name}</span>
                </h3>
                <p className="text-gray-700 text-sm">
                    Player: <span className="font-medium text-gray-900">{currentPlayer.name}</span>
                    {currentPlayer.id === playerId && (
                        <span className="ml-1 inline-block bg-green-100 text-green-800 text-xs px-1 rounded-full">
                            (You)
                        </span>
                    )}
                </p>
            </div>
        );
    };

    const renderGameControls = () => {
        if (!isMyTurn) {
            const currentTeam = teams[currentTeamIndex];
            const currentPlayer = currentTeam?.players[currentPlayerIndex];

            return (
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">Waiting for {currentPlayer?.name} to play</p>
                    <p className="text-gray-700 text-xs">
                        {isMyTurn
                            ? "It's your turn!"
                            : `${currentPlayer?.name} from ${currentTeam?.name} is currently playing`}
                    </p>
                    <div className="mt-2 flex justify-center">
                        <div className="w-6 h-6 border-t-3 border-blue-700 border-solid rounded-full animate-spin"></div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg text-center shadow-md border border-blue-200">
                    {currentWord ? (
                        <div>
                            <p className="text-sm text-gray-700 mb-1">Your word:</p>
                            <p className="text-2xl font-bold text-blue-700 animate-pulse">{currentWord.text}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-blue-800">Click "Get Word" to start your turn</p>
                    )}
                </div>

                <div className="flex flex-row gap-2 justify-center">
                    <button
                        onClick={handleGetWord}
                        disabled={!isMyTurn || currentWord !== null}
                        className="py-2 px-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-md hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm"
                    >
                        Get Word
                    </button>

                    <button
                        onClick={handleSkipWord}
                        disabled={!isMyTurn || currentWord === null}
                        className="py-2 px-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-md hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm"
                    >
                        Skip
                    </button>

                    <button
                        onClick={handleDoneWord}
                        disabled={!isMyTurn || currentWord === null}
                        className="py-2 px-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-md hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    };

    const renderDrawingCanvas = () => {
        if (round !== 3) return null;

        return (
            <div className="mt-2 flex flex-col items-center">
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <canvas ref={canvasRef} width={400} height={200} className="bg-white" />
                </div>
                {isMyTurn && <p className="text-gray-600 mt-1 text-xs">Draw using your mouse</p>}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 h-[80vh] max-h-[600px] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-3 -mx-4 -mt-4 rounded-t-lg text-white mb-2">
                <h2 className="text-lg font-bold text-center">{roundTitle}</h2>
                <p className="text-center font-medium text-blue-100 text-xs">{roundInstructions}</p>
            </div>

            <div className="flex justify-center mb-2">
                <div
                    className={`text-center py-1 px-4 rounded-full text-sm ${
                        timeLeft <= 10 ? "bg-red-100 text-red-800 animate-pulse" : "bg-blue-100 text-blue-800"
                    }`}
                >
                    <span className="font-bold">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {renderPlayerTurn()}
                {renderGameControls()}
                {renderDrawingCanvas()}
            </div>

            <div className="mt-2 border-t border-gray-200 pt-2">
                <h3 className="text-sm font-semibold mb-2 text-gray-900">Team Scores</h3>
                <div className="grid grid-cols-3 gap-2">
                    {teams.map((team) => (
                        <div
                            key={team.id}
                            className={`p-2 border rounded-md text-center bg-white transition-all ${
                                currentTeamIndex === teams.indexOf(team)
                                    ? "border-blue-400 shadow-md bg-blue-50"
                                    : "border-gray-200"
                            }`}
                        >
                            <h4 className="font-medium text-gray-800 text-xs">{team.name}</h4>
                            <p className="text-xl font-bold text-blue-700">{team.score}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
