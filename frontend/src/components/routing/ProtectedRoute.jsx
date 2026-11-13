import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Box, CircularProgress, Typography } from '@mui/material'

import { useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'

import { endAuthSession, getAuthSessionGeneration, refreshAccessToken } from '../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

const SKEW_SECONDS = 30

function ProtectedRoute({ children }) {
    const queryClient = useQueryClient()
    const [isAuthorized, setIsAuthorized] = useState(null)

    useEffect(() => {
        let cancelled = false

        const generationAtStart = getAuthSessionGeneration()

        const invalidateSession = () => {
            if (cancelled) return
            // The session could have changed while an old token was refreshing.
            if (getAuthSessionGeneration() !== generationAtStart) {
                if (!localStorage.getItem(REFRESH_TOKEN)) setIsAuthorized(false)
                return
            }

            endAuthSession()
            void queryClient.cancelQueries()
            queryClient.clear()
            setIsAuthorized(false)
        }

        const checkAuthorization = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN)

            if (!token) {
                invalidateSession()
                return
            }

            try {
                const decoded = jwtDecode(token)
                const expiresAt = decoded?.exp
                const now = Date.now() / 1000

                if (!expiresAt || expiresAt - now < SKEW_SECONDS) {
                    await refreshAccessToken()
                }

                if (!cancelled && getAuthSessionGeneration() === generationAtStart) {
                    setIsAuthorized(true)
                }
            } catch {
                invalidateSession()
            }
        }

        void checkAuthorization()

        return () => {
            cancelled = true
        }
    }, [queryClient])

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
