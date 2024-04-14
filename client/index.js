let timeleft = 60;
let timerStarted = false;

function startTimer() {
    let timer = setInterval(function () {
        timeleft--;
        document.getElementById("timer").textContent = `0:${timeleft < 10 ? "0" : ""}${timeleft}`;
        if (timeleft == 0) {
            document.getElementById("timer").innerHTML = "Time is up";
            timeleft = 60;
            clearInterval(timer);
        }
    }, 1000);

    // Set initial font size
    document.getElementById("timer").style.fontSize = "4rem"; // Adjust the font size here
}

function handleClick() {
    if (!timerStarted) {
        startTimer();
        timerStarted = true;
        // Remove the event listener once clicked
        document.getElementById("hatButton").removeEventListener("click", handleClick);
    }
}

document.getElementById("hatButton").addEventListener("click", handleClick);
