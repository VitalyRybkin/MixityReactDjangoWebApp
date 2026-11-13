// Protects nested routes using the current user's permissions.
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/useAuth.js'

// Waits for authentication data, then renders the route or redirects denied access to /403.
export default function PermissionRoute({ permission, any = [], all = [] }) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useAuth()

    const location = useLocation()

    if (isLoading) {
        return null
    }

    let allowed = true

    if (permission) {
        allowed = hasPermission(permission)
    }

    if (any.length > 0) {
        allowed = allowed && hasAnyPermission(any)
    }

    if (all.length > 0) {
        allowed = allowed && hasAllPermissions(all)
    }

    return allowed ? <Outlet /> : <Navigate to="/403" replace state={{ from: location.pathname }} />
}
