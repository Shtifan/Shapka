const socket = io();

document.addEventListener("mouseup", () => {
    socket.emit("click");
});

socket.on("click", (click) => {
    console.log(click);
});

const loginForm = document.getElementById("loginForm");
const createRoomButton = document.getElementById("createRoom");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Get username and room ID from the form
    const username = document.getElementById("username").value;
    const roomId = document.getElementById("roomId").value;

    // Emit joinRoom event to server with username and room ID
    socket.emit("joinRoom", roomId, username);

    // Redirect to index.html
    window.location.href = "/room/" + roomId;
});

createRoomButton.addEventListener("click", async () => {
    // Get username from the form
    const username = document.getElementById("username").value;

    // Generate a new room ID
    const roomId = generateRoomId(6); // Adjust the length of the room ID as needed

    // Emit createRoom event to server with username and room ID
    socket.emit("createRoom", roomId, username);

    // Display the room ID on the page
    const roomDisplay = document.getElementById("roomDisplay");
    roomDisplay.textContent = "Room ID: " + roomId;
});

function generateRoomId(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let roomId = "";

    for (let i = 0; i < length; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return roomId;
}
