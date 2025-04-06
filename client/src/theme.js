import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#FE6B8B",
            light: "#FF8E53",
            dark: "#FE5981",
            contrastText: "#fff",
        },
        secondary: {
            main: "#64b5f6",
            light: "#9be7ff",
            dark: "#2286c3",
            contrastText: "#fff",
        },
        error: {
            main: "#ff1744",
            light: "#ff4569",
            dark: "#b2102f",
            contrastText: "#fff",
        },
        background: {
            default: "#1a1a1a",
            paper: "#282828",
        },
        text: {
            primary: "#fff",
            secondary: "rgba(255,255,255,0.7)",
            disabled: "rgba(255,255,255,0.5)",
        },
    },
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(","),
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});

export default theme;
