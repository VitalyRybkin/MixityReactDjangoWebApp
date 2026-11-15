// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AxiosError } from 'axios'

import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'

const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

const responseFor = (config, data) => ({
    config,
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
})

// Keep Axios's real interceptor and cancellation pipeline, replacing only transport.
const pendingAdapter = () => {
    const started = deferred()
    const completion = deferred()
    let config

    return {
        adapter: (requestConfig) => {
            config = requestConfig
            started.resolve(config)
            return completion.promise
        },
        started: started.promise,
        resolve: (data) => completion.resolve(responseFor(config, data)),
        reject: (error) => completion.reject(error),
    }
}

// Separate module instances model browser tabs sharing the same localStorage.
const loadTab = async () => {
    vi.resetModules()
    return import('./api.js')
}

beforeEach(() => {
    localStorage.clear()
})

describe('authentication session changes', () => {
    it.each(['success', 'network failure', 'abort'])(
        'rejects a pending request after logout despite its eventual %s',
        async (outcome) => {
            const tab = await loadTab()
            tab.startAuthSession('access-before-logout', 'refresh-before-logout')
            const pending = pendingAdapter()
            const controller = new AbortController()
            const request = tab.default.get('/api/orders/', {
                adapter: pending.adapter,
                signal: controller.signal,
            })
            const config = await pending.started
            const rejected = expect(request).rejects.toMatchObject({ code: 'AUTH_SESSION_CHANGED' })

            tab.endAuthSession()
            if (outcome === 'network failure') {
                pending.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))
            } else {
                if (outcome === 'abort') controller.abort()
                pending.resolve({ private: 'old account data' })
            }

            await rejected
        },
    )

    it('rejects a pending response when another tab logs out', async () => {
        const firstTab = await loadTab()
        firstTab.startAuthSession('access-before-logout', 'refresh-before-logout')
        const secondTab = await loadTab()
        const pending = pendingAdapter()
        const request = firstTab.default.get('/api/orders/', { adapter: pending.adapter })
        await pending.started
        const rejected = expect(request).rejects.toMatchObject({ code: 'AUTH_SESSION_CHANGED' })

        secondTab.endAuthSession()
        pending.resolve({ private: 'old account data' })

        await rejected
    })

    it.each(['same tab', 'another tab'])('cannot restore tokens after logout in the %s', async (logoutIn) => {
        const firstTab = await loadTab()
        firstTab.startAuthSession('old-access', 'old-refresh')
        const logoutTab = logoutIn === 'same tab' ? firstTab : await loadTab()
        const pending = pendingAdapter()
        firstTab.default.defaults.adapter = pending.adapter
        const refresh = firstTab.refreshAccessToken()
        await pending.started
        const rejected = expect(refresh).rejects.toMatchObject({ code: 'AUTH_SESSION_CHANGED' })

        logoutTab.endAuthSession()
        pending.resolve({ access: 'late-access', refresh: 'late-refresh' })

        await rejected
        expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull()
        expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull()
    })

    it('preserves an existing session-change error instead of classifying it as a network error', async () => {
        const tab = await loadTab()
        tab.startAuthSession('access', 'refresh')
        const pending = pendingAdapter()
        const request = tab.default.get('/api/orders/', { adapter: pending.adapter })
        const config = await pending.started
        const error = Object.assign(new Error('Session changed'), { code: 'AUTH_SESSION_CHANGED', config })
        const rejected = expect(request).rejects.toBe(error)

        pending.reject(error)

        await rejected
    })
})

describe('requests in the current session', () => {
    it('still classifies a network failure as a network error', async () => {
        const tab = await loadTab()
        tab.startAuthSession('access', 'refresh')
        const pending = pendingAdapter()
        const request = tab.default.get('/api/orders/', { adapter: pending.adapter })
        const config = await pending.started
        const rejected = expect(request).rejects.toMatchObject({ isNetworkError: true })

        pending.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))

        await rejected
    })

    it.each(['same tab', 'another tab'])(
        'keeps pending responses valid when the %s rotates tokens',
        async (refreshIn) => {
            const firstTab = await loadTab()
            firstTab.startAuthSession('old-access', 'old-refresh')
            const refreshTab = refreshIn === 'same tab' ? firstTab : await loadTab()
            const generation = firstTab.getAuthSessionGeneration()
            const pending = pendingAdapter()
            const request = firstTab.default.get('/api/orders/', { adapter: pending.adapter })
            await pending.started
            refreshTab.default.defaults.adapter = async (config) =>
                responseFor(config, { access: 'new-access', refresh: 'new-refresh' })

            await expect(refreshTab.refreshAccessToken()).resolves.toBe('new-access')
            expect(firstTab.getAuthSessionGeneration()).toBe(generation)
            expect(localStorage.getItem(ACCESS_TOKEN)).toBe('new-access')
            expect(localStorage.getItem(REFRESH_TOKEN)).toBe('new-refresh')
            pending.resolve({ private: 'current account data' })

            await expect(request).resolves.toMatchObject({ data: { private: 'current account data' } })
        },
    )
})

describe('login requests', () => {
    it('accepts a successful login response despite a session change while waiting', async () => {
        const tab = await loadTab()
        tab.startAuthSession('old-access', 'old-refresh')
        const pending = pendingAdapter()
        const login = tab.default.post('/api/auth/token/', {}, { adapter: pending.adapter })
        await pending.started

        tab.endAuthSession()
        pending.resolve({ access: 'login-access', refresh: 'login-refresh' })

        await expect(login).resolves.toMatchObject({ data: { access: 'login-access', refresh: 'login-refresh' } })
    })

    it('preserves a login rejection despite a session change while waiting', async () => {
        const tab = await loadTab()
        tab.startAuthSession('old-access', 'old-refresh')
        const pending = pendingAdapter()
        const login = tab.default.post('/api/auth/token/', {}, { adapter: pending.adapter })
        const config = await pending.started
        const response = { ...responseFor(config, { detail: 'Invalid credentials' }), status: 401 }
        const error = new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, null, response)
        const rejected = expect(login).rejects.toBe(error)

        tab.endAuthSession()
        pending.reject(error)

        await rejected
    })
})
