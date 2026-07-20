import { createContext, useContext, useMemo } from 'react'

import { useGetUserMe } from '../../../features/common/common.queries.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const { data: user, isLoading, isError } = useGetUserMe()

    const value = useMemo(() => {
        const permissions = new Set(user?.permissions ?? [])
        const groups = new Set(user?.groups ?? [])

        const hasPermission = (permission) => {
            if (!permission) {
                return true
            }

            return user?.is_superuser === true || permissions.has('*') || permissions.has(permission)
        }

        const hasAnyPermission = (requiredPermissions) => {
            return requiredPermissions.some(hasPermission)
        }

        const hasAllPermissions = (requiredPermissions) => {
            return requiredPermissions.every(hasPermission)
        }

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
    }, [user, isLoading, isError, user?.groups, user?.is_superuser])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}
