document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get username and room ID from the form
        const username = document.getElementById("username").value;
        const roomId = document.getElementById("roomId").value;

        // Emit joinRoom event to server with username and room ID
        socket.emit("joinRoom", roomId, username);
    });
});
