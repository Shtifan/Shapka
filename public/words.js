// public/words.js - WHOLE FILE

const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

const wordForm = document.getElementById("word-form");
const statusList = document.getElementById("status-list");
const wordInputsContainer = document.createElement("div");
wordForm.appendChild(wordInputsContainer);

// Generate 5 input fields (changed from 10)
for (let i = 1; i <= 5; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Word ${i}`;
    input.required = true;
    wordInputsContainer.appendChild(input);
}

// Add the submit button after the inputs
const submitButton = document.createElement("button");
submitButton.type = "submit";
submitButton.textContent = "Submit 5 Words";
wordForm.appendChild(submitButton);

// --- EMIT EVENTS ---
wordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = Array.from(wordInputsContainer.querySelectorAll("input"));
    const words = inputs.map((input) => input.value.trim());

    if (words.some((w) => w === "")) {
        alert("Please fill out all 5 words.");
        return;
    }

    socket.emit("submitWords", words);
    submitButton.disabled = true;
    submitButton.textContent = "Words Submitted!";
    inputs.forEach((input) => (input.disabled = true));
});

// --- LISTEN FOR EVENTS ---
socket.on("wordSubmissionUpdate", (players) => {
    statusList.innerHTML = ""; // Clear the list for redraw
    Object.values(players).forEach((player) => {
        const li = document.createElement("li");
        let text = `Player ${player.id.substring(0, 4)}`;

        if (player.id === socket.id) {
            text = "You"; // Make it clear who you are
        }

        if (player.words.length === 5) {
            li.classList.add("done");
            li.textContent = `${text} (Ready ✔️)`;
        } else {
            li.textContent = `${text} (Waiting...)`;
        }
        statusList.appendChild(li);
    });
});

socket.on("allWordsSubmitted", () => {
    window.location.href = `/round1?roomId=${roomId}`;
});

// On connect, ensure we join the room to get updates
socket.on("connect", () => {
    if (roomId) {
        socket.emit("joinRoom", roomId);
    }
});
