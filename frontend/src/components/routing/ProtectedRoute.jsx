import { Fragment, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

import { useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'

import { AUTH_SESSION_ID_KEY, endAuthSession, getAuthSessionGeneration, isInvalidRefreshError, refreshAccessToken } from '../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

const SKEW_SECONDS = 30
const OTHER_TAB_GRACE_MS = 1500

function accessTokenIsValid(token, skewSeconds = 0) {
    if (!token) return false
    try {
        const exp = jwtDecode(token)?.exp
        return typeof exp === 'number' && exp > Date.now() / 1000 + skewSeconds
    } catch {
        return false
    }
}

function ProtectedRoute({ children }) {
    const queryClient = useQueryClient()
    const [isAuthorized, setIsAuthorized] = useState(null)
    const [temporaryError, setTemporaryError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)
    const [verifiedSession, setVerifiedSession] = useState(null)

    useEffect(() => {
        let cancelled = false

        const generationAtStart = getAuthSessionGeneration()

        // A login in another tab publishes new credentials, not necessarily a logout.
        // Keep private data hidden until the new session has been validated.
        const recheckChangedSession = () => {
            void queryClient.cancelQueries()
            queryClient.clear()
            setVerifiedSession(null)
            setIsAuthorized(null)
            setTemporaryError(null)
            setRetryCount((count) => count + 1)
        }

        const onStorage = (event) => {
            if (cancelled) return

            if (event.key === AUTH_SESSION_ID_KEY && getAuthSessionGeneration() !== generationAtStart) {
                // Recheck shared credentials instead of forcing /login.
                // If the other tab logged out, the check will find no tokens.
                recheckChangedSession()
                return
            }

            if (
                (event.key === ACCESS_TOKEN || event.key === REFRESH_TOKEN) &&
                event.newValue &&
                getAuthSessionGeneration() === generationAtStart
            ) {
                // A second tab may finish its successful refresh after this tab failed.
                // Re-check the shared tokens instead of leaving the screen at Retry.
                setTemporaryError(null)
                setRetryCount((count) => count + 1)
            }
        }
        window.addEventListener('storage', onStorage)

        const clearPrivateData = () => {
            void queryClient.cancelQueries()
            queryClient.clear()
        }

        const checkAuthorization = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN)
            const refresh = localStorage.getItem(REFRESH_TOKEN)

            if (!token && !refresh) {
                setIsAuthorized(false)
                return
            }

            if (!accessTokenIsValid(token, SKEW_SECONDS)) {
                setIsAuthorized(null)
                setTemporaryError(null)
                if (!refresh) {
                    // An expired access token without a refresh token cannot be used.
                    if (!cancelled && getAuthSessionGeneration() === generationAtStart) {
                        endAuthSession()
                        clearPrivateData()
                        setIsAuthorized(false)
                    }
                    return
                }
            }

            try {
                if (!accessTokenIsValid(token, SKEW_SECONDS)) {
                    await refreshAccessToken()
                }

                if (cancelled || getAuthSessionGeneration() !== generationAtStart) return
                if (!accessTokenIsValid(localStorage.getItem(ACCESS_TOKEN))) {
                    throw Object.assign(new Error('Invalid access token after refresh'), { code: 'AUTH_INVALID_ACCESS' })
                }

                setTemporaryError(null)
                setVerifiedSession(generationAtStart)
                setIsAuthorized(true)
            } catch (error) {
                if (cancelled) return
                if (getAuthSessionGeneration() !== generationAtStart) {
                    recheckChangedSession()
                    return
                }
                if (error?.code === 'AUTH_SESSION_CHANGED') {
                    // Token rotation changed unexpectedly without a login/logout.
                    // Let the user retry instead of clearing shared credentials.
                    setIsAuthorized(null)
                    setTemporaryError('server')
                    return
                }

                // Another tab may have finished refreshing after this request failed.
                const newAccess = localStorage.getItem(ACCESS_TOKEN)
                if (newAccess !== token && accessTokenIsValid(newAccess)) {
                    setTemporaryError(null)
                    setVerifiedSession(generationAtStart)
                    setIsAuthorized(true)
                    return
                }

                if (isInvalidRefreshError(error) || error?.code === 'AUTH_INVALID_ACCESS') {
                    // Allow in-flight same-session rotations a brief chance to publish
                    // their tokens. With Web Locks this is normally unnecessary.
                    await new Promise((resolve) => setTimeout(resolve, OTHER_TAB_GRACE_MS))
                    if (cancelled) return
                    if (getAuthSessionGeneration() !== generationAtStart) {
                        recheckChangedSession()
                        return
                    }
                    const latestAccess = localStorage.getItem(ACCESS_TOKEN)
                    if (latestAccess !== token && accessTokenIsValid(latestAccess)) {
                        setTemporaryError(null)
                        setVerifiedSession(generationAtStart)
                        setIsAuthorized(true)
                        return
                    }
                    if (localStorage.getItem(REFRESH_TOKEN) !== refresh) {
                        // A new refresh token was published; recheck its session.
                        setRetryCount((count) => count + 1)
                        return
                    }

                    // Definitively invalid refresh for this session: go to Login.
                    endAuthSession()
                    clearPrivateData()
                    setIsAuthorized(false)
                    return
                }

                // Network/5xx failures must not log out the user.
                setIsAuthorized(null)
                setTemporaryError(error?.isNetworkError ? 'network' : 'server')
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
                    {temporaryError === 'network'
                        ? 'Нет связи с сервером. Проверьте подключение и попробуйте снова.'
                        : 'Не удалось проверить авторизацию. Попробуйте ещё раз.'}
                </Alert>
                <Button
                    sx={{ mt: 2 }}
                    variant="contained"
                    onClick={() => {
                        setTemporaryError(null)
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

    // Remount the private subtree when the login changes so /me, permissions,
    // and component-local state cannot leak from the previous account.
    return isAuthorized
        ? <Fragment key={verifiedSession}>{children}</Fragment>
        : <Navigate to="/login" replace />
}

export default ProtectedRoute
