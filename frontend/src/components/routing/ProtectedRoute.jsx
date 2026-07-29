import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Box, CircularProgress, Typography } from '@mui/material'

import { jwtDecode } from 'jwt-decode'

import api from '../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

const SKEW_SECONDS = 30

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null)
    const ranRef = useRef(false)

    useEffect(() => {
        // Helps avoid duplicate authentication runs in development StrictMode.
        if (ranRef.current) return
        ranRef.current = true
        ;(async () => {
            try {
                await auth()
            } catch {
                setIsAuthorized(false)
            }
        })()
    }, [])

    const refreshToken = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN)

        if (!refresh) {
            setIsAuthorized(false)
            return
        }

        const response = await api.post('/api/auth/token/refresh/', {
            refresh,
        })

        localStorage.setItem(ACCESS_TOKEN, response.data.access)
        setIsAuthorized(true)
    }

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN)

        if (!token) {
            setIsAuthorized(false)
            return
        }

        let decoded

        try {
            decoded = jwtDecode(token)
        } catch {
            localStorage.removeItem(ACCESS_TOKEN)
            localStorage.removeItem(REFRESH_TOKEN)
            setIsAuthorized(false)
            return
        }

        const exp = decoded?.exp
        const now = Date.now() / 1000

        if (!exp || exp - now < SKEW_SECONDS) {
            await refreshToken()
        } else {
            setIsAuthorized(true)
        }
    }

    if (isAuthorized === null) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    bgcolor: 'background.default',
                }}
            >
                <CircularProgress size={42} thickness={4} />

                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Проверяем авторизацию...
                </Typography>
            </Box>
        )
    }

    return isAuthorized ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
