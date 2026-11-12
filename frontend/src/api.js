import axios from 'axios'

import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import { notifyApiError } from './utils/apiError.js'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

const redirectToUnauthorized = () => {
    const from = `${window.location.pathname}${window.location.search}`

    if (window.location.pathname !== '/401') {
        window.location.replace(`/401?from=${encodeURIComponent(from)}`)
    }
}

// Refresh-token rotation is NOT an account change. Only an explicit
// login/logout or invalidation advances this generation.
let sessionGeneration = 0
export const getAuthSessionGeneration = () => sessionGeneration

export function startAuthSession(access, refresh) {
    sessionGeneration += 1
    localStorage.setItem(ACCESS_TOKEN, access)
    localStorage.setItem(REFRESH_TOKEN, refresh)
}

export function endAuthSession() {
    sessionGeneration += 1
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
}

const sessionChanged = () => Object.assign(new Error('Сессия изменилась.'), { code: 'AUTH_SESSION_CHANGED' })
const isCurrentSession = (generation) => generation === sessionGeneration

const endSessionIfCurrent = (generation) => {
    if (!isCurrentSession(generation)) return false
    endAuthSession()
    redirectToUnauthorized()
    return true
}

api.interceptors.request.use(
    (config) => {
        // Preserve the original generation when retrying an earlier request.
        config._authSessionGeneration ??= sessionGeneration
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (token && !config.headers?.Authorization) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

let refreshPromise = null
let refreshGeneration = null

export async function refreshAccessToken() {
    const generation = sessionGeneration
    const refresh = localStorage.getItem(REFRESH_TOKEN)
    if (!refresh) throw new Error('Refresh token is missing')

    if (refreshPromise && refreshGeneration === generation) {
        return refreshPromise
    }

    const pending = (async () => {
        const response = await api.post('/api/auth/token/refresh/', { refresh })
        if (!isCurrentSession(generation)) throw sessionChanged()

        const newAccess = response.data.access
        localStorage.setItem(ACCESS_TOKEN, newAccess)
        if (response.data.refresh) {
            localStorage.setItem(REFRESH_TOKEN, response.data.refresh)
        }
        return newAccess
    })()

    refreshPromise = pending
    refreshGeneration = generation

    try {
        return await pending
    } finally {
        if (refreshPromise === pending) {
            refreshPromise = null
            refreshGeneration = null
        }
    }
}

api.interceptors.response.use(
    (response) => {
        const generation = response.config?._authSessionGeneration
        const isLoginRequest = response.config?.url?.endsWith('/api/auth/token/')
        if (!isLoginRequest && generation !== undefined && !isCurrentSession(generation)) {
            return Promise.reject(sessionChanged())
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config
        if (!error.response) {
            return Promise.reject({ message: 'Нет связи с сервером', isNetworkError: true })
        }

        const status = error.response.status
        if (originalRequest?.url?.endsWith('/api/auth/token/')) return Promise.reject(error)

        const generation = originalRequest?._authSessionGeneration
        if (generation !== undefined && !isCurrentSession(generation)) {
            return Promise.reject(sessionChanged())
        }

        if (status === 503) {
            notifyApiError(error)
            return Promise.reject(error)
        }

        if (status === 403) {
            if (window.location.pathname !== '/') window.location.replace('/')
            return Promise.reject(error)
        }

        if (status !== 401) return Promise.reject(error)

        if (originalRequest?.url?.includes('/api/auth/token/refresh/')) {
            endSessionIfCurrent(generation)
            return Promise.reject(error)
        }

        if (!originalRequest || originalRequest._retry) return Promise.reject(error)
        originalRequest._retry = true

        let newAccess
        try {
            // A different request may have already refreshed the access token.
            // In that case retry directly rather than rotating the refresh token again.
            const previousAuthorization = originalRequest.headers?.Authorization
            const currentAccess = localStorage.getItem(ACCESS_TOKEN)
            newAccess = currentAccess && previousAuthorization !== `Bearer ${currentAccess}`
                ? currentAccess
                : await refreshAccessToken()

            if (!isCurrentSession(generation)) throw sessionChanged()
        } catch (refreshError) {
            // Only an authentication-refresh failure can invalidate the session.
            if (refreshError?.code !== 'AUTH_SESSION_CHANGED') {
                endSessionIfCurrent(generation)
            }
            return Promise.reject(refreshError)
        }

        // Do NOT catch errors from the retried business request here.
        // A 400/409/500 after a successful refresh is not a reason to log out.
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
    },
)

export default api
