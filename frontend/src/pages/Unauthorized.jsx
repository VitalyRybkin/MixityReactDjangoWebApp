// Authentication-required page with automatic and manual navigation to login.
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Box, Button, Typography } from '@mui/material'

// Displays the 401 message and redirects to login after five seconds or a button click.
export default function Unauthorized() {
    const [seconds, setSeconds] = useState(5)
    const [redirect, setRedirect] = useState(false)

    useEffect(
        // Schedules each countdown tick and enables the redirect at zero.
        () => {
            if (seconds === 0) {
                setRedirect(true)
                return
            }

            const timer = setTimeout(
                // Updates the countdown after one second.
                () => {
                    setSeconds(
                        // Decreases the latest countdown value by one.
                        (value) => value - 1,
                    )
                },
                1000,
            )

            // Cancels the pending tick when the effect is cleaned up.
            return () => clearTimeout(timer)
        },
        [seconds],
    )

    if (redirect) {
        return <Navigate to="/login" replace />
    }

    return (
        <Box
            sx={{
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
            }}
        >
            <Typography variant="h2">401</Typography>

            <Typography variant="h5">ТРЕБУЕТСЯ АВТОРИЗАЦИЯ</Typography>

            <Typography color="text.secondary">Необходимо войти в систему.</Typography>

            <Typography sx={{ mt: 2 }}>
                Переход на страницу входа через
                <br />
                <strong style={{ fontWeight: 'bold', fontSize: '2rem' }}>{seconds}</strong>
            </Typography>

            <Button
                variant="contained"
                onClick={
                    // Starts the redirect without waiting for the countdown.
                    () => setRedirect(true)
                }
            >
                Войти сейчас
            </Button>
        </Box>
    )
}
