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
            if (cancelled) return

            if (event.key === AUTH_SESSION_ID_KEY && getAuthSessionGeneration() !== generationAtStart) {
                // A different login/logout changed the account. Never end that new session.
                void queryClient.cancelQueries()
                queryClient.clear()
                setIsAuthorized(false)
                return
            }

            if (
                (event.key === ACCESS_TOKEN || event.key === REFRESH_TOKEN) &&
                event.newValue &&
                getAuthSessionGeneration() === generationAtStart
            ) {
                // A second tab may finish its successful refresh after this tab failed.
                // Re-check the shared tokens instead of leaving the screen at Retry.
                setTemporaryError(false)
                setRetryCount((count) => count + 1)
            }
        }
        window.addEventListener('storage', onStorage)

        const checkAuthorization = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN)
            const refresh = localStorage.getItem(REFRESH_TOKEN)

            if (!token && !refresh) {
                // Nothing to refresh. The user is not authenticated, but do not
                // mutate shared storage from a route guard.
                setIsAuthorized(false)
                return
            }

            try {
                const expiresAt = token ? jwtDecode(token)?.exp : null
                const now = Date.now() / 1000

                if (!expiresAt || expiresAt - now < SKEW_SECONDS) {
                    await refreshAccessToken()
                }

                if (!cancelled && getAuthSessionGeneration() === generationAtStart) {
                    setTemporaryError(false)
                    setIsAuthorized(true)
                }
            } catch (error) {
                if (cancelled) return
                if (error?.code === 'AUTH_SESSION_CHANGED' || getAuthSessionGeneration() !== generationAtStart) {
                    // A different account replaced the one we were checking.
                    void queryClient.cancelQueries()
                    queryClient.clear()
                    setIsAuthorized(false)
                    return
                }

                // A concurrent refresh might already have written a newer access
                // token. Its success must win over this tab's rejected refresh.
                const latestToken = localStorage.getItem(ACCESS_TOKEN)
                if (latestToken && latestToken !== token) {
                    try {
                        const latestExpiry = jwtDecode(latestToken)?.exp
                        if (latestExpiry && latestExpiry > Date.now() / 1000) {
                            setTemporaryError(false)
                            setIsAuthorized(true)
                            return
                        }
                    } catch {
                        // The new token is unusable; keep storage intact for Retry.
                    }
                }

                // A refresh 400/401/403 does not prove the *shared* session is
                // invalid: another tab may still be completing a successful refresh.
                // Do not call endAuthSession() on a background failure.
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
                <Alert severity="warning">
                    Не удалось подтвердить сессию. Другая вкладка может обновлять токен.
                    Попробуйте повторить запрос или войдите заново.
                </Alert>
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
                <Button
                    sx={{ mt: 2, ml: 1 }}
                    onClick={() => {
                        // Only an explicit user action can terminate a shared session.
                        endAuthSession()
                        void queryClient.cancelQueries()
                        queryClient.clear()
                        setIsAuthorized(false)
                    }}
                >
                    Войти заново
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
