// Conditionally renders content based on the current user's permissions and groups.
import { useAuth } from '../context/AuthContext.jsx'

// Renders children when every supplied access requirement passes, or the fallback otherwise.
export default function Can({ permission, group, any = [], all = [], fallback = null, children }) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasGroup } = useAuth()

    let allowed = true

    if (group) {
        const requiredGroups = Array.isArray(group) ? group : [group]

        allowed = requiredGroups.some(hasGroup)
    }

    if (permission) {
        allowed = allowed && hasPermission(permission)
    }

    if (any.length > 0) {
        allowed = allowed && hasAnyPermission(any)
    }

    if (all.length > 0) {
        allowed = allowed && hasAllPermissions(all)
    }

    return allowed ? children : fallback
}
