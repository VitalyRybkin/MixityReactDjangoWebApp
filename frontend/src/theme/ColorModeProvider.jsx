import React, {useMemo, useState, useEffect} from "react";
import {ThemeProvider, createTheme, CssBaseline} from "@mui/material";
import {ColorModeContext} from "./colorModeContext";

const STORAGE_KEY = "mui-color-mode";

function getInitialMode() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark"; // default
}

export default function ColorModeProvider({children}) {
    const [mode, setMode] = useState("dark");

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
                    ...(mode === "dark"
                        ? {
                            background: {default: "#0f172a", paper: "#1e293b"},
                            divider: "rgba(255,255,255,0.08)",
                            text: {primary: "#e2e8f0", secondary: "#94a3b8"},
                        }
                        : {
                            background: {default: "#f8fafc", paper: "#ffffff"},
                            text: {primary: "#123c5a", secondary: "#94a3b8"},
                        }),
                },
                shape: {borderRadius: 12},
                typography: {
                    fontFamily: ["Ubuntu", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"].join(","),
                    h4: {fontWeight: 700},
                    h6: {fontWeight: 600},
                    button: {fontWeight: 500, textTransform: "none"},
                },
            }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={{mode, toggleColorMode}}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}