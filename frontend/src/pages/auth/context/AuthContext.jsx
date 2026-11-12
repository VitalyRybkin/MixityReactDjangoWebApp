// Shares the current user, loading state, and access-check helpers through React context.
import { createContext, useContext, useMemo } from 'react'

import { useGetUserMe } from '../../../features/common/common.queries.js'

const AuthContext = createContext(null)

// Loads the current user and provides authentication state and access checks to descendants.
export function AuthProvider({ children }) {
    const { data: user, isLoading, isError } = useGetUserMe()

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
    }, [user, isLoading, isError, user?.groups, user?.is_superuser])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Returns the authentication context and rejects use outside its provider.
export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}
