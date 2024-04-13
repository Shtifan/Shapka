let timeleft = 60;

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
    document.getElementById("timer").style.fontSize = "3rem"; // Adjust the font size here
}

document.getElementById("hatButton").addEventListener("click", function () {
    if (timeleft == 60) startTimer();
});
