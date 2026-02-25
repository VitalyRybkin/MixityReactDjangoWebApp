import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const ColorModeContext = createContext({
    mode: "light",
    toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

const STORAGE_KEY = "mui-color-mode";

function getInitialMode() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;

    const prefersDark =
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    return prefersDark ? "dark" : "light";
}

export const ColorModeProvider = ({ children }) => {
    const [mode, setMode] = useState("light");

    useEffect(() => {
        setMode(getInitialMode());
    }, []);

    const toggleColorMode = () => {
        setMode((prev) => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
                shape: {
                    borderRadius: 12,
                },
                typography: {
                    fontFamily: [
                        "Inter",
                        "system-ui",
                        "-apple-system",
                        "Segoe UI",
                        "Roboto",
                        "Arial",
                        "sans-serif",
                    ].join(","),
                },
            }),
        [mode]
    );

    const value = useMemo(() => ({ mode, toggleColorMode }), [mode]);

    return (
        <ColorModeContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};