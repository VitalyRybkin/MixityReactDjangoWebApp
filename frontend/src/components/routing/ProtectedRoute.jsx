import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

import { useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'

import { AUTH_SESSION_ID_KEY, endAuthSession, getAuthSessionGeneration, refreshAccessToken } from '../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

const SKEW_SECONDS = 30

function ProtectedRoute({ children }) {
    const queryClient = useQueryClient()
    const [isAuthorized, setIsAuthorized] = useState(null)
    const [temporaryError, setTemporaryError] = useState(false)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        let cancelled = false

        const generationAtStart = getAuthSessionGeneration()
        const onStorage = (event) => {
            if (event.key === AUTH_SESSION_ID_KEY && getAuthSessionGeneration() !== generationAtStart) {
                void queryClient.cancelQueries()
                queryClient.clear()
                setIsAuthorized(false)
            }
        }
        window.addEventListener('storage', onStorage)

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
            } catch (error) {
                if (cancelled) return
                if (error?.code === 'AUTH_SESSION_CHANGED') {
                    // Another tab signed in as a different user. Do not log
                    // that new account out from this stale tab.
                    void queryClient.cancelQueries()
                    queryClient.clear()
                    setIsAuthorized(false)
                    return
                }
                const status = error?.response?.status
                if ([400, 401, 403].includes(status) || error?.message === 'Refresh token is missing') {
                    invalidateSession()
                    return
                }
                // 503/network failures must show Retry, not force a logout.
                setTemporaryError(true)
            }
        }

        void checkAuthorization()

        return () => {
            cancelled = true
            window.removeEventListener('storage', onStorage)
        }
    }, [queryClient, retryCount])

    if (temporaryError && isAuthorized === null) {
        return (
            <Box sx={{ p: 3, maxWidth: 520, mx: 'auto', mt: 8 }}>
                <Alert severity="warning">Не удалось обновить сессию. Проверьте соединение и повторите попытку.</Alert>
                <Button
                    sx={{ mt: 2 }}
                    variant="contained"
                    onClick={() => {
                        setTemporaryError(false)
                        setRetryCount((count) => count + 1)
                    }}
                >
                    Повторить
                </Button>
            </Box>
        )
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
