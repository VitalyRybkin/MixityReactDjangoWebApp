import axios from 'axios'

import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import { notifyApiError } from './utils/apiError.js'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// A session identity must be shared between browser tabs, unlike a module-local
// generation. Access/refresh rotation does NOT change this identity.
export const AUTH_SESSION_ID_KEY = 'mixity_auth_session_id'
let sessionGeneration = 0

const newSessionId = () => crypto.randomUUID()

const sharedSessionId = () => {
    let id = localStorage.getItem(AUTH_SESSION_ID_KEY)
    // Upgrade existing logins without forcing everyone to sign in again.
    if (!id && localStorage.getItem(REFRESH_TOKEN)) {
        const generated = newSessionId()
        localStorage.setItem(AUTH_SESSION_ID_KEY, generated)
        id = localStorage.getItem(AUTH_SESSION_ID_KEY)
    }
    return id ?? ''
}

export const getAuthSessionGeneration = () => `${sessionGeneration}:${sharedSessionId()}`

export function startAuthSession(access, refresh) {
    sessionGeneration += 1
    // Publish the identity before tokens: pending refreshes in *other* tabs
    // must become invalid before they can write credentials.
    localStorage.setItem(AUTH_SESSION_ID_KEY, newSessionId())
    localStorage.setItem(ACCESS_TOKEN, access)
    localStorage.setItem(REFRESH_TOKEN, refresh)
}

export function endAuthSession() {
    sessionGeneration += 1
    localStorage.setItem(AUTH_SESSION_ID_KEY, newSessionId())
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
}

const sessionChanged = () => Object.assign(new Error('Сессия изменилась.'), { code: 'AUTH_SESSION_CHANGED' })
const isCurrentSession = (generation) => generation === getAuthSessionGeneration()

api.interceptors.request.use(
    (config) => {
        // Preserve the original generation when retrying an earlier request.
        config._authSessionGeneration ??= getAuthSessionGeneration()
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
    const generation = getAuthSessionGeneration()
    const refresh = localStorage.getItem(REFRESH_TOKEN)
    if (!refresh) throw new Error('Refresh token is missing')

    if (refreshPromise && refreshGeneration === generation) {
        return refreshPromise
    }

    const pending = (async () => {
        let response
        try {
            response = await api.post('/api/auth/token/refresh/', { refresh })
        } catch (error) {
            if (!isCurrentSession(generation)) throw sessionChanged()
            // Another tab may have rotated this session's refresh token first.
            if (localStorage.getItem(REFRESH_TOKEN) !== refresh) {
                const latestAccess = localStorage.getItem(ACCESS_TOKEN)
                if (latestAccess) return latestAccess
            }
            throw error
        }
        if (!isCurrentSession(generation)) throw sessionChanged()

        // Do not overwrite another tab's newer refresh result.
        if (localStorage.getItem(REFRESH_TOKEN) !== refresh) {
            const latestAccess = localStorage.getItem(ACCESS_TOKEN)
            if (latestAccess) return latestAccess
            throw sessionChanged()
        }

        const newAccess = response.data.access
        if (!newAccess) throw new Error('Refresh returned no access token')
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

        // A resource-specific 403 is not a global login failure. In particular,
        // users may view orders while lacking access to the stock or catalog API.

        if (status !== 401) return Promise.reject(error)

        if (originalRequest?.url?.includes('/api/auth/token/refresh/')) {
            // A tab may be rotating the same token right now. Never invalidate
            // shared credentials on this tab's rejected refresh response.
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
            // The refresh may be transient or a losing concurrent rotation.
            // Leave account state intact; explicit logout is the only safe
            // place to delete shared credentials without cross-tab arbitration.
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
