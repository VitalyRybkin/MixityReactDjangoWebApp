import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

export default function GroupRoute({ groups = [] }) {
    const { hasGroup, isLoading } = useAuth()

    if (isLoading) {
        return null
    }

    const allowed = groups.some(hasGroup)

    const location = useLocation()

    return allowed ? <Outlet /> : <Navigate to="/403" replace state={{ from: location.pathname }} />
}
