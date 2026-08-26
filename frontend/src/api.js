import axios from 'axios'

import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN)

        if (token) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error),
)

let refreshPromise = null

export async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise
    }

    refreshPromise = (async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN)

        if (!refresh) {
            throw new Error('Refresh token is missing')
        }

        const response = await api.post('/api/auth/token/refresh/', {
            refresh,
        })

        const newAccess = response.data.access
        const newRefresh = response.data.refresh

        localStorage.setItem(ACCESS_TOKEN, newAccess)

        if (newRefresh) {
            localStorage.setItem(REFRESH_TOKEN, newRefresh)
        }

        return newAccess
    })()

    try {
        return await refreshPromise
    } finally {
        refreshPromise = null
    }
}

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config

        if (!error.response) {
            return Promise.reject({
                message: 'Нет связи с сервером',
                isNetworkError: true,
            })
        }

        const isLoginRequest = originalRequest.url?.endsWith('/api/auth/token/')

        if (isLoginRequest) {
            return Promise.reject(error)
        }

        if (error.response.status !== 401) {
            return Promise.reject(error)
        }

        const isRefreshRequest = originalRequest.url?.includes('/api/auth/token/refresh/')

        if (isRefreshRequest) {
            localStorage.removeItem(ACCESS_TOKEN)
            localStorage.removeItem(REFRESH_TOKEN)

            window.location.href = '/login'

            return Promise.reject(error)
        }

        if (originalRequest._retry) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
            const newAccess = await refreshAccessToken()

            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${newAccess}`

            return api(originalRequest)
        } catch (refreshError) {
            localStorage.removeItem(ACCESS_TOKEN)
            localStorage.removeItem(REFRESH_TOKEN)

            window.location.href = '/login'

            return Promise.reject(refreshError)
        }
    },
)

export default api
