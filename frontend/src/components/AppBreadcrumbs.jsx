import React from 'react'
import { Breadcrumbs, Link, Typography } from '@mui/material'
import { Link as RouterLink, matchPath, useLocation } from 'react-router-dom'
import { routes } from '../routes/routes'

function normalizePath(path) {
    if (!path || path === '') return '/'
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

export default function AppBreadcrumbs({ dynamicLabels = {} }) {
    const location = useLocation()
    const pathname = normalizePath(location.pathname)

    if (pathname === '/') {
        return (
            <Breadcrumbs sx={{ mb: 2 }}>
                <Typography color="text.primary">Главная</Typography>
            </Breadcrumbs>
        )
    }

    const segments = pathname.split('/').filter(Boolean)
    const urls = segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`)

    const sortedRoutes = [...routes].sort((a, b) => b.path.length - a.path.length)

    const crumbs = urls
        .map((url) => {
            const matchedRoute = sortedRoutes.find((route) =>
                matchPath({ path: route.path, end: true }, url)
            )

            if (!matchedRoute) return null

            let label = matchedRoute.breadcrumb

            if (matchedRoute.path.endsWith('/:id') && dynamicLabels.id) {
                label = dynamicLabels.id
            }

            return {
                to: url,
                label,
            }
        })
        .filter(Boolean)

    return (
        <Breadcrumbs sx={{ mb: 4 }}>
            <Link component={RouterLink} underline="hover" color="inherit" to="/">
                Главная
            </Link>

            {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1

                return last ? (
                    <Typography key={crumb.to} color="text.primary">
                        {crumb.label}
                    </Typography>
                ) : (
                    <Link
                        key={crumb.to}
                        component={RouterLink}
                        underline="hover"
                        color="inherit"
                        to={crumb.to}
                    >
                        {crumb.label}
                    </Link>
                )
            })}
        </Breadcrumbs>
    )
}