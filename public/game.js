const socket = io();

document.addEventListener("DOMContentLoaded", function () {
    // letiable to track if the timer has started
    let timerStarted = false;

    // Function to start the timer
    function startTimer(duration, display) {
        let timer = duration,
            minutes,
            seconds;
        setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                timer = duration;
            }
        }, 1000);
    }

    // Event listener for the hat button
    document.getElementById("hatButton").addEventListener("click", function () {
        // Check if the timer has not started already
        if (!timerStarted) {
            // Time duration in seconds (1 minute in this case)
            let duration = 60,
                display = document.querySelector("#timer");
            startTimer(duration, display);

            // Set timerStarted to true to prevent starting again on subsequent clicks
            timerStarted = true;
        }
    });
});
