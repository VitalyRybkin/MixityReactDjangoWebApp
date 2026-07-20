import { useAuth } from '../context/AuthContext.jsx'

export default function Can({ permission, group, any = [], all = [], fallback = null, children }) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasGroup } = useAuth()

    let allowed = true

    if (group) {
        allowed = hasGroup(group)
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
