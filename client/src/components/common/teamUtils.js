export function getTeamTextColor(teamName) {
    if (!teamName) return "text.primary";
    switch (teamName) {
        case "team1":
            return "#2196f3";
        case "team2":
            return "#e91e63";
        case "team3":
            return "#4caf50";
        case "team4":
            return "#ff9800";
        default:
            return "#ffffff";
    }
}

export function getTeamColorDark(teamName) {
    if (!teamName) return "#aaa";
    switch (teamName) {
        case "team1":
            return "#64b5f6";
        case "team2":
            return "#f48fb1";
        case "team3":
            return "#81c784";
        case "team4":
            return "#ffb74d";
        default:
            return "#aaa";
    }
}

export function getTeamBackgroundColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.05)";
    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.15)";
        case "team2":
            return "rgba(233,30,99,0.15)";
        case "team3":
            return "rgba(76,175,80,0.15)";
        case "team4":
            return "rgba(255,152,0,0.15)";
        default:
            return "rgba(255,255,255,0.05)";
    }
}

export function getTeamBorderColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.1)";
    switch (teamName) {
        case "team1":
            return "rgba(33,150,243,0.3)";
        case "team2":
            return "rgba(233,30,99,0.3)";
        case "team3":
            return "rgba(76,175,80,0.3)";
        case "team4":
            return "rgba(255,152,0,0.3)";
        default:
            return "rgba(255,255,255,0.1)";
    }
}

export function getTeamAvatarColor(teamName) {
    if (!teamName) return "rgba(255,255,255,0.2)";
    switch (teamName) {
        case "team1":
            return "#42a5f5";
        case "team2":
            return "#ec407a";
        case "team3":
            return "#66bb6a";
        case "team4":
            return "#ffa726";
        default:
            return "rgba(255,255,255,0.2)";
    }
}

export function getTeamName(teamName) {
    if (!teamName) return "No Team";
    const teamNumber = teamName.replace("team", "");
    return `Team ${teamNumber}`;
}
