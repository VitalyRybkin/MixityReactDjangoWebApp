// Shares the current user, loading state, and access-check helpers through React context.
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { endAuthSession, getAuthSessionGeneration, isInvalidRefreshError } from '../../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../../constants.js'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

import { useGetUserMe } from '../../../features/common/common.queries.js'

import { AuthContext } from './useAuth.js'

// Loads the current user and provides authentication state and access checks to descendants.
export function AuthProvider({ children }) {
    const queryClient = useQueryClient()
    const { data: user, isLoading, isError, isFetching, error, refetch } = useGetUserMe()
    const [resolvingSession, setResolvingSession] = useState(false)
    const authRejected = isError && (isInvalidRefreshError(error) || error?.response?.status === 401)

    // If /me cannot refresh an invalid session, return to login automatically.
    // Do not treat connection failures or ordinary resource 403s as logout.
    useEffect(() => {
        if (!authRejected) {
            setResolvingSession(false)
            return undefined
        }

        let cancelled = false
        const generation = getAuthSessionGeneration()
        const accessBefore = localStorage.getItem(ACCESS_TOKEN)
        const refreshBefore = localStorage.getItem(REFRESH_TOKEN)
        setResolvingSession(true)

        const timeout = setTimeout(() => {
            if (cancelled || getAuthSessionGeneration() !== generation) return
            if (
                localStorage.getItem(ACCESS_TOKEN) !== accessBefore ||
                localStorage.getItem(REFRESH_TOKEN) !== refreshBefore
            ) {
                setResolvingSession(false)
                void refetch()
                return
            }
            endAuthSession()
            void queryClient.cancelQueries()
            queryClient.clear()
            // This also works when the provider is mounted outside BrowserRouter.
            window.location.replace('/login')
        }, 1500)

        return () => {
            cancelled = true
            clearTimeout(timeout)
        }
    }, [authRejected, queryClient, refetch])

    const value = useMemo(/* Builds access-check helpers from the current authentication state. */ () => {
        const permissions = new Set(user?.permissions ?? [])
        const groups = new Set(user?.groups ?? [])

        // Accepts an empty requirement, superuser access, a wildcard, or an explicit permission.
        const hasPermission = (permission) => {
            if (!permission) {
                return true
            }

            return user?.is_superuser === true || permissions.has('*') || permissions.has(permission)
        }

        // Checks whether at least one requested permission is granted.
        const hasAnyPermission = (requiredPermissions) => {
            return requiredPermissions.some(hasPermission)
        }

        // Checks whether every requested permission is granted.
        const hasAllPermissions = (requiredPermissions) => {
            return requiredPermissions.every(hasPermission)
        }

        // Grants group access to superusers or members of the requested group.
        const hasGroup = (groupName) => {
            return user?.is_superuser === true || groups.has(groupName)
        }

        return {
            user,
            isLoading,
            isError,
            isAuthenticated: Boolean(user),

            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            hasGroup,
        }
    }, [user, isLoading, isError])

    // Do not render private pages until /me has been checked. This also covers
    // the home page, which does not pass through PermissionRoute.
    if (isLoading || resolvingSession || authRejected) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={26} />
                <Typography color="text.secondary">Проверяем авторизацию…</Typography>
            </Box>
        )
    }

    // A temporary network/API failure is not a permission denial (403).
    // Keep all private screens unmounted and allow a retry of the /me query.
    if (isError || !user) {
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8, px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="warning">Не удалось проверить права доступа. Попробуйте повторить запрос.</Alert>
                <Button
                    variant="contained"
                    disabled={isFetching}
                    onClick={() => { void refetch() }}
                >
                    {isFetching ? 'Проверяем…' : 'Повторить'}
                </Button>
            </Box>
        )
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
