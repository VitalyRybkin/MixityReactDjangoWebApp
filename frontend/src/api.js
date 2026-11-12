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

api.interceptors.request.use(
    (config) => {
        // Keep the session identity from when this request was sent.
        // It must never refresh or revoke a different user's session.
        config._authSessionRefresh = localStorage.getItem(REFRESH_TOKEN)
        const token = localStorage.getItem(ACCESS_TOKEN)

        if (token) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error),
)

// A request started before logout/login must not overwrite the new tokens.
const sessionChanged = () => Object.assign(new Error('Сессия изменилась.'), { code: 'AUTH_SESSION_CHANGED' })
const sameSession = (refresh) => localStorage.getItem(REFRESH_TOKEN) === refresh

let refreshPromise = null
let refreshInFlightFor = null

export async function refreshAccessToken() {
    const refresh = localStorage.getItem(REFRESH_TOKEN)
    if (!refresh) {
        throw new Error('Refresh token is missing')
    }

    if (refreshPromise && refreshInFlightFor === refresh) {
        return refreshPromise
    }

    const pending = (async () => {
        const response = await api.post('/api/auth/token/refresh/', { refresh })

        // Login/logout or another rotated session happened while the request ran.
        if (!sameSession(refresh)) {
            throw sessionChanged()
        }

        const newAccess = response.data.access
        const newRefresh = response.data.refresh

        localStorage.setItem(ACCESS_TOKEN, newAccess)
        if (newRefresh) {
            localStorage.setItem(REFRESH_TOKEN, newRefresh)
        }

        return newAccess
    })()

    refreshPromise = pending
    refreshInFlightFor = refresh

    try {
        return await pending
    } finally {
        // Do not erase a newer session's in-flight refresh operation.
        if (refreshPromise === pending) {
            refreshPromise = null
            refreshInFlightFor = null
        }
    }
}

api.interceptors.response.use(
    (response) => {
        const requestRefresh = response.config?._authSessionRefresh
        const isLogin = response.config?.url?.endsWith('/api/auth/token/')
        if (!isLogin && requestRefresh !== undefined && !sameSession(requestRefresh)) {
            return Promise.reject(sessionChanged())
        }
        return response
    },

    async (error) => {
        const originalRequest = error.config

        if (!error.response) {
            return Promise.reject({
                message: 'Нет связи с сервером',
                isNetworkError: true,
            })
        }

        const status = error.response.status
        const isLoginRequest = originalRequest?.url?.endsWith('/api/auth/token/')

        if (isLoginRequest) {
            return Promise.reject(error)
        }

        // A late 401/403 from user A must not log out or redirect user B.
        if (originalRequest?._authSessionRefresh !== undefined &&
            !sameSession(originalRequest._authSessionRefresh)) {
            return Promise.reject(sessionChanged())
        }

        if (status === 503) {
            notifyApiError(error)
            return Promise.reject(error)
        }

        if (status === 403) {
            if (window.location.pathname !== '/') {
                window.location.replace('/')
            }

            return Promise.reject(error)
        }

        if (status !== 401) {
            return Promise.reject(error)
        }

        const isRefreshRequest = originalRequest?.url?.includes('/api/auth/token/refresh/')

        if (isRefreshRequest) {
            // Only revoke the session for which refresh was requested.
            if (sameSession(originalRequest._authSessionRefresh)) {
                localStorage.removeItem(ACCESS_TOKEN)
                localStorage.removeItem(REFRESH_TOKEN)
                redirectToUnauthorized()
            }

            return Promise.reject(error)
        }

        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error)
        }

        originalRequest._retry = true
        const requestRefresh = originalRequest._authSessionRefresh

        try {
            const newAccess = await refreshAccessToken()
            if (localStorage.getItem(ACCESS_TOKEN) !== newAccess) {
                throw sessionChanged()
            }

            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${newAccess}`

            return api(originalRequest)
        } catch (refreshError) {
            // Neither stale requests nor stale refresh failures can delete new credentials.
            if (refreshError?.code !== 'AUTH_SESSION_CHANGED' && sameSession(requestRefresh)) {
                localStorage.removeItem(ACCESS_TOKEN)
                localStorage.removeItem(REFRESH_TOKEN)
                redirectToUnauthorized()
            }

            return Promise.reject(refreshError)
        }
    },
)

export default api
