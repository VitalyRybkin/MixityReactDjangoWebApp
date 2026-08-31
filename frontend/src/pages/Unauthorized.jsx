import { useEffect, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'

import { Box, Button, Typography } from '@mui/material'

export default function Unauthorized() {
    const [seconds, setSeconds] = useState(5)
    const [redirect, setRedirect] = useState(false)

    const location = useLocation()
    const [searchParams] = useSearchParams()

    const from = location.state?.from ?? searchParams.get('from') ?? 'запрошенной странице'

    useEffect(() => {
        if (seconds === 0) {
            setRedirect(true)
            return
        }

        const timer = setTimeout(() => {
            setSeconds((value) => value - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [seconds])

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

            <Typography color="text.secondary">
                Для доступа к
                <br />
                <strong>{from}</strong>
                <br />
                необходимо войти в систему.
            </Typography>

            <Typography sx={{ mt: 2 }}>
                Переход на страницу входа через
                <br />
                <strong style={{ fontWeight: 'bold', fontSize: '2rem' }}>{seconds}</strong>
            </Typography>

            <Button variant="contained" onClick={() => setRedirect(true)}>
                Войти сейчас
            </Button>
        </Box>
    )
}
