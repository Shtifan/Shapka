import { useState, useEffect, useCallback } from "react";
import { REQUIRED_WORDS_PER_PLAYER, SOCKET_EVENTS } from "../constants";
import socketManager from "../utils/socket";

export function useWordSubmission(roomName) {
    const [words, setWords] = useState([]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        const handleAllWordsSubmitted = () => {
            setHasSubmitted(true);
            setIsSubmitting(false);
        };

        socketManager.on(SOCKET_EVENTS.ALL_WORDS_SUBMITTED, handleAllWordsSubmitted);

        return () => {
            socketManager.off(SOCKET_EVENTS.ALL_WORDS_SUBMITTED, handleAllWordsSubmitted);
        };
    }, []);

    const validateWords = useCallback((wordList) => {
        if (!Array.isArray(wordList)) {
            return "Words must be provided as an array";
        }

        if (wordList.length !== REQUIRED_WORDS_PER_PLAYER) {
            return `You must submit exactly ${REQUIRED_WORDS_PER_PLAYER} words`;
        }

        const uniqueWords = new Set(wordList.map((w) => w.trim().toLowerCase()));
        if (uniqueWords.size !== wordList.length) {
            return "All words must be unique";
        }

        const invalidWords = wordList.filter((word) => !word.trim() || /[^a-zA-Z\s]/.test(word));
        if (invalidWords.length > 0) {
            return "Words can only contain letters and spaces";
        }

        return null;
    }, []);

    const submitWords = useCallback(
        async (wordList) => {
            const validationError = validateWords(wordList);
            if (validationError) {
                setError(validationError);
                return false;
            }

            setIsSubmitting(true);
            setError(null);

            try {
                socketManager.submitWords(roomName, wordList);
                setWords(wordList);
                setHasSubmitted(true);
                return true;
            } catch (err) {
                setError("Failed to submit words. Please try again.");
                setIsSubmitting(false);
                return false;
            }
        },
        [roomName, validateWords]
    );

    const resetSubmission = useCallback(() => {
        setWords([]);
        setError(null);
        setIsSubmitting(false);
        setHasSubmitted(false);
    }, []);

    return {
        words,
        error,
        isSubmitting,
        hasSubmitted,
        submitWords,
        resetSubmission,
        validateWords,
    };
}
