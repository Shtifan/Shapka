const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// --- HTML Element References ---
const timerDisplay = document.getElementById("timer");
const wordDisplay = document.getElementById("word-display");
const newWordBtn = document.getElementById("new-word-btn");
const guessedBtn = document.getElementById("guessed-btn");
const skipBtn = document.getElementById("skip-btn");
const wordsLeftDisplay = document.getElementById("words-left");
const teamAScoreDisplay = document.getElementById("teamA-score");
const teamBScoreDisplay = document.getElementById("teamB-score");
const gameStatusDisplay = document.getElementById("game-status");

let clientTimer; // To store the setInterval ID

// --- Emit Events to Server ---
newWordBtn.addEventListener("click", () => socket.emit("startTurn"));
guessedBtn.addEventListener("click", () => socket.emit("wordGuessed"));
skipBtn.addEventListener("click", () => socket.emit("skipWord"));

// --- Listen for Events from Server ---

socket.on("connect", () => {
    if (roomId) {
        // You might re-emit joinRoom here to handle reloads gracefully,
        // but for now, the server state will hold.
    }
});

socket.on("startRound1", (gameState) => {
    updateUI(gameState);
});

socket.on("turnBegan", (data) => {
    wordDisplay.textContent = data.currentWord;
    startClientTimer(data.turnEndTime);
    updateControls(true, socket.id); // Enable controls for everyone for now
});

socket.on("gameStateUpdate", (data) => {
    if (data.currentWord) wordDisplay.textContent = data.currentWord;
    if (data.scores) updateScores(data.scores);
    if (data.wordsLeft !== undefined) wordsLeftDisplay.textContent = data.wordsLeft;
});

socket.on("turnEnded", (data) => {
    clearInterval(clientTimer);
    timerDisplay.textContent = "1:00";
    wordDisplay.textContent = "- - -";
    updateUI(data);
});

socket.on("roundEnded", (data) => {
    clearInterval(clientTimer);
    gameStatusDisplay.textContent = `ROUND OVER! ${data.winner} wins!`;
    wordDisplay.textContent = "🎉";
    updateControls(false); // Disable all controls
});

// --- UI Helper Functions ---

function updateUI(state) {
    if (state.scores) updateScores(state.scores);
    if (state.wordsLeft !== undefined) wordsLeftDisplay.textContent = state.wordsLeft;

    const isActivePlayer = state.activePlayerId === socket.id;
    gameStatusDisplay.textContent = `It's Player ${state.activePlayerId.substring(0, 4)}'s (${state.activeTeam}) turn.`;
    updateControls(isActivePlayer);
}

function updateScores(scores) {
    teamAScoreDisplay.textContent = scores.teamA;
    teamBScoreDisplay.textContent = scores.teamB;
}

function updateControls(isActivePlayer, turnInProgress = false) {
    // The "New Word" button is only for the active player, and only when a turn isn't running.
    newWordBtn.disabled = !isActivePlayer || turnInProgress;

    // The "Guessed" and "Skip" buttons are for everyone during a turn.
    // In a real game, you might only enable this for the *other* teammate.
    guessedBtn.disabled = !turnInProgress;
    skipBtn.disabled = !turnInProgress;
}

function startClientTimer(endTime) {
    clearInterval(clientTimer);
    clientTimer = setInterval(() => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
            clearInterval(clientTimer);
            timerDisplay.textContent = "0:00";
            return;
        }
        const seconds = Math.floor((remaining / 1000) % 60)
            .toString()
            .padStart(2, "0");
        const minutes = Math.floor((remaining / 1000 / 60) % 60).toString();
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 500);
}
