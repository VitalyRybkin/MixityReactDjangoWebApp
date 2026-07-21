import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Box, Typography } from '@mui/material'

export default function Forbidden() {
    const [seconds, setSeconds] = useState(5)
    const [redirect, setRedirect] = useState(false)

    const location = useLocation()

    const from = location.state?.from

    useEffect(() => {
        if (seconds === 0) {
            setRedirect(true)
            return
        }

        const timer = setTimeout(() => {
            setSeconds((s) => s - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [seconds])

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

            <Typography color="text.secondary">
                Вы не имеете доступа к
                <br />
                <strong>{from}</strong>
            </Typography>

            <Typography sx={{ mt: 3 }}>
                Перенаправление на главную страницу <br />
                <strong style={{ fontWeight: 'bold', fontSize: '2rem' }}>{seconds}</strong>
            </Typography>
        </Box>
    )
}
