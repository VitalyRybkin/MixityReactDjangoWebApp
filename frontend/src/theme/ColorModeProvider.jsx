import React, { useEffect, useMemo, useState } from 'react'

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import { ColorModeContext } from './colorModeContext'

const STORAGE_KEY = 'mui-color-mode'

function getInitialMode() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
}

export default function ColorModeProvider({ children }) {
    const [mode, setMode] = useState('dark')

    useEffect(() => {
        setMode(getInitialMode())
    }, [])

    const toggleColorMode = () => {
        setMode((prev) => {
            const next = prev === 'light' ? 'dark' : 'light'
            localStorage.setItem(STORAGE_KEY, next)
            return next
        })
    }

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'dark'
                        ? {
                              primary: {
                                  main: '#60a5fa',
                                  light: '#93c5fd',
                                  dark: '#3b82f6',
                                  contrastText: '#0f172a',
                              },
                              secondary: {
                                  main: '#a78bfa',
                                  light: '#c4b5fd',
                                  dark: '#8b5cf6',
                                  contrastText: '#0f172a',
                              },
                              background: {
                                  default: '#111827',
                                  paper: '#111827',
                              },
                              text: {
                                  primary: '#e5e7eb',
                                  secondary: '#94a3b8',
                              },
                              divider: 'rgba(148, 163, 184, 0.16)',
                              success: {
                                  main: '#22c55e',
                              },
                              warning: {
                                  main: '#f59e0b',
                              },
                              error: {
                                  main: '#ef4444',
                              },
                              info: {
                                  main: '#38bdf8',
                              },
                          }
                        : {
                              primary: {
                                  main: '#2563eb',
                                  light: '#60a5fa',
                                  dark: '#1d4ed8',
                                  contrastText: '#ffffff',
                              },
                              secondary: {
                                  main: '#7c3aed',
                                  light: '#a78bfa',
                                  dark: '#6d28d9',
                                  contrastText: '#ffffff',
                              },
                              background: {
                                  default: '#f8fafc',
                                  paper: '#ffffff',
                              },
                              text: {
                                  primary: '#172b67',
                                  secondary: '#475569',
                              },
                              divider: 'rgba(15, 23, 42, 0.08)',
                              success: {
                                  main: '#16a34a',
                              },
                              warning: {
                                  main: '#d97706',
                              },
                              error: {
                                  main: '#dc2626',
                              },
                              info: {
                                  main: '#0284c7',
                              },
                          }),
                },

                shape: { borderRadius: 12 },

                typography: {
                    fontFamily: [
                        'Ubuntu',
                        'system-ui',
                        '-apple-system',
                        'Segoe UI',
                        'Roboto',
                        'Arial',
                        'sans-serif',
                    ].join(','),

                    h4: {
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        letterSpacing: '-0.02em',
                    },
                    h6: {
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.4,
                        letterSpacing: '-0.01em',
                    },
                    body1: {
                        fontSize: '1rem',
                        fontWeight: 400,
                        lineHeight: 1.6,
                        letterSpacing: '-0.01em',
                    },
                    body2: {
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.55,
                        letterSpacing: '-0.005em',
                    },
                    button: {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: '-0.005em',
                        textTransform: 'none',
                    },
                },

                components: {
                    MuiCssBaseline: {
                        styleOverrides: {
                            body: {
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                            },
                        },
                    },

                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                            },
                        },
                    },

                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                                paddingInline: 14,
                                paddingBlock: 8,
                                boxShadow: 'none',
                            },
                            contained: {
                                boxShadow: 'none',
                            },
                        },
                    },

                    MuiIconButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                            },
                        },
                    },

                    MuiTableCell: {
                        styleOverrides: {
                            head: {
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            },
                            body: {
                                fontWeight: 300,
                                fontSize: '0.875rem',
                            },
                        },
                    },

                    MuiInputBase: {
                        styleOverrides: {
                            root: {
                                fontSize: '0.95rem',
                            },
                            input: {
                                lineHeight: 1.5,
                            },
                        },
                    },

                    MuiOutlinedInput: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                            },
                        },
                    },

                    MuiChip: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                            },
                            label: {
                                fontWeight: 500,
                            },
                        },
                    },

                    MuiAlert: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
                            },
                        },
                    },

                    MuiDivider: {
                        styleOverrides: {
                            root: {
                                opacity: 1,
                            },
                        },
                    },
                },
            }),
        [mode],
    )

    return (
        <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}
