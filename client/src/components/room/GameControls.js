import React from "react";
import { Box, Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CircularProgress from "@mui/material/CircularProgress";

function GameControls({ gameState, canStart, isStarting, onStartGame, onLeaveRoom }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: gameState === "waiting" ? "space-between" : "flex-end",
                mt: 3,
                gap: 2,
            }}
        >
            {gameState === "waiting" && (
                <Button
                    variant="contained"
                    onClick={onStartGame}
                    disabled={!canStart || isStarting}
                    size="large"
                    startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                    sx={{
                        minWidth: 180,
                        py: 1.5,
                        order: { xs: 1, md: 2 },
                        fontWeight: "bold",
                        bgcolor: canStart && !isStarting ? "#64b5f6" : "#444",
                        color: "#111",
                        "&:hover": {
                            bgcolor: canStart ? "#90caf9" : "#444",
                        },
                        "&.Mui-disabled": {
                            bgcolor: "rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.3)",
                        },
                    }}
                    fullWidth={window.innerWidth < 900}
                >
                    {isStarting ? "Starting..." : "Start Game"}
                </Button>
            )}

            <Button
                variant="outlined"
                color="error"
                onClick={onLeaveRoom}
                size="large"
                startIcon={<ExitToAppIcon />}
                fullWidth={window.innerWidth < 900}
                sx={{
                    order: { xs: 2, md: 1 },
                    borderColor: "#f44336",
                    color: "#f44336",
                    "&:hover": {
                        backgroundColor: "rgba(244,67,54,0.08)",
                        borderColor: "#d32f2f",
                    },
                    marginLeft: gameState !== "waiting" ? "auto" : 0,
                }}
            >
                Leave Room
            </Button>
        </Box>
    );
}

export default GameControls;
