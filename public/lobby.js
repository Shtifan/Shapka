// public/lobby.js - WHOLE FILE

// Establish a connection with the Socket.IO server.
const socket = io();

// --- Initial Setup ---

// Read the 'roomId' from the URL (e.g., from ?roomId=my-cool-room).
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// Get references to the HTML elements we will be manipulating.
const roomTitle = document.getElementById("roomTitle");
const joinTeamAButton = document.getElementById("joinTeamA");
const joinTeamBButton = document.getElementById("joinTeamB");
const statusDiv = document.getElementById("status");
const teamASlots = [document.getElementById("teamA_slot1"), document.getElementById("teamA_slot2")];
const teamBSlots = [document.getElementById("teamB_slot1"), document.getElementById("teamB_slot2")];

// --- Check for Room ID and Emit Join Event ---
if (roomId) {
    roomTitle.innerText = `Lobby for Room: ${roomId}`;
    socket.emit("joinRoom", roomId);
} else {
    roomTitle.innerText = "Error: No Room ID provided!";
}

// --- Client Actions (Emitting Events) ---
joinTeamAButton.addEventListener("click", () => {
    socket.emit("joinTeam", "teamA");
});
joinTeamBButton.addEventListener("click", () => {
    socket.emit("joinTeam", "teamB");
});

// --- Server Responses (Listening for Events) ---

socket.on("lobbyUpdate", (room) => {
    // --- Render Team A Slots ---
    teamASlots.forEach((slot) => {
        slot.textContent = "Empty";
        slot.classList.remove("filled");
    });
    room.teams.teamA.forEach((playerId, index) => {
        const slot = teamASlots[index];
        slot.textContent = `Player ${playerId.substring(0, 4)}`;
        slot.classList.add("filled");
    });

    // --- Render Team B Slots ---
    teamBSlots.forEach((slot) => {
        slot.textContent = "Empty";
        slot.classList.remove("filled");
    });
    room.teams.teamB.forEach((playerId, index) => {
        const slot = teamBSlots[index];
        slot.textContent = `Player ${playerId.substring(0, 4)}`;
        slot.classList.add("filled");
    });

    // --- Update Status Message ---
    const playersNeeded = 4 - (room.teams.teamA.length + room.teams.teamB.length);
    if (playersNeeded > 0) {
        statusDiv.textContent = `Waiting for ${playersNeeded} more player(s)...`;
    } else {
        statusDiv.textContent = "Teams are full! Preparing for next phase...";
        joinTeamAButton.disabled = true;
        joinTeamBButton.disabled = true;
    }
});

// ***** THE FIX IS HERE *****
// Listen for the signal to start the next phase.
socket.on("startWordSubmission", () => {
    // This now correctly redirects to the /words page.
    window.location.href = `/words?roomId=${roomId}`;
});
