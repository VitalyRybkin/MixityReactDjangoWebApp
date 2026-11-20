// Access-denied page with a five-second countdown before returning home.
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Box, Typography } from '@mui/material'

// Displays the 403 message and redirects home when the countdown ends.
export default function Forbidden() {
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
                        (s) => s - 1,
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
        return <Navigate to="/" replace />
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
            }}
        >
            <Typography variant="h2" gutterBottom>
                403
            </Typography>

            <Typography variant="h5" gutterBottom>
                ДОСТУП ЗАПРЕЩЕН
            </Typography>

            <Typography color="text.secondary">Вы не имеете доступа к данной странице.</Typography>

            <Typography sx={{ mt: 3 }}>
                Перенаправление на главную страницу <br />
                <strong style={{ fontWeight: 'bold', fontSize: '2rem' }}>{seconds}</strong>
            </Typography>
        </Box>
    )
}
