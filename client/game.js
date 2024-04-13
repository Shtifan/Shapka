let timeleft = 60;

function startTimer() {
    let timer = setInterval(function () {
        document.getElementById("timer").style.fontSize = "80px";
        timeleft--;
        document.getElementById("timer").textContent = `0:${timeleft < 10 ? "0" : ""}${timeleft}`;
        if (timeleft == 0) {
            document.getElementById("timer").style.fontSize = "60px";
            document.getElementById("timer").innerHTML = "Time is up";
            timeleft = 60;
            clearInterval(timer);
        }
    }, 1000);
}

document.getElementById("hatButton").addEventListener("click", function () {
    if (timeleft == 60) startTimer();
});
