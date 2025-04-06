import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SnackbarProvider } from "notistack";
import theme from "./theme";
import Home from "./components/home/Home";
import GameRoom from "./components/room/GameRoom";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                autoHideDuration={3000}
            >
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/room/:roomName" element={<GameRoom />} />
                    </Routes>
                </Router>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

export default App;
