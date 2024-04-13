document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get username from the form
        const username = document.getElementById("username").value;

        // Generate a new room ID
        const roomId = generateRoomId(6); // Adjust the length of the room ID as needed

        // Emit createRoom event to server with username and room ID
        socket.emit("createRoom", roomId, username);
    });
});

function generateRoomId(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let roomId = "";

    for (let i = 0; i < length; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return roomId;
}
