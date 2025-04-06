import React, { useState, useRef, useEffect } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { REQUIRED_WORDS_PER_PLAYER } from "../../constants";

function WordInput({ onSubmit, isSubmitting, error }) {
    const [words, setWords] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setWords(value);

        // Count words (split by whitespace and filter out empty strings)
        const count = value
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
        setWordCount(count);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Split by whitespace and filter out empty strings
        const wordArray = words
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0);

        if (wordArray.length === REQUIRED_WORDS_PER_PLAYER) {
            onSubmit(wordArray);
            setWords("");
            setWordCount(0);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: "#282828",
                border: error ? "1px solid #f44336" : "1px solid rgba(255,255,255,0.1)",
            }}
        >
            <Typography variant="h6" gutterBottom color="white">
                Submit Your Words
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.7)" }}>
                Enter {REQUIRED_WORDS_PER_PLAYER} words separated by spaces. These words will be used in the game.
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        inputRef={inputRef}
                        fullWidth
                        multiline
                        rows={3}
                        value={words}
                        onChange={handleChange}
                        placeholder="Enter your words here..."
                        disabled={isSubmitting}
                        error={!!error}
                        helperText={error || `${wordCount}/${REQUIRED_WORDS_PER_PLAYER} words`}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "white",
                                "& fieldset": {
                                    borderColor: "rgba(255,255,255,0.23)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "rgba(255,255,255,0.5)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#64b5f6",
                                },
                            },
                            "& .MuiFormHelperText-root": {
                                color: error ? "#f44336" : "rgba(255,255,255,0.7)",
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={wordCount !== REQUIRED_WORDS_PER_PLAYER || isSubmitting}
                        endIcon={<SendIcon />}
                        sx={{
                            bgcolor: wordCount === REQUIRED_WORDS_PER_PLAYER ? "#64b5f6" : "#444",
                            color: "#111",
                            "&:hover": {
                                bgcolor: wordCount === REQUIRED_WORDS_PER_PLAYER ? "#90caf9" : "#444",
                            },
                        }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Words"}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
}

export default WordInput;
