// @vitest-environment jsdom
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_ID_KEY, refreshAccessToken, startAuthSession } from '../../api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants.js'

import ProtectedRoute from './ProtectedRoute.jsx'

vi.mock('../../api.js', async (importOriginal) => ({
    ...await importOriginal(),
    refreshAccessToken: vi.fn(),
}))

const token = (expiresIn) => `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + expiresIn }))}.signature`

const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

let container
let root
let queryClient
let mounted
let unmounted

function PrivatePage() {
    useEffect(() => {
        mounted()
        return unmounted
    }, [])
    return <input aria-label="Private draft" defaultValue="Unsaved draft" />
}

const privateInput = () => container.querySelector('input[aria-label="Private draft"]')

const renderRoute = async () => {
    await act(async () => {
        root.render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} />
                        <Route path="/login" element={<div>Public login</div>} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        )
    })
}

// jsdom, like a browser, does not send storage events back to the writing tab.
const remoteWrite = async (key, newValue) => {
    const oldValue = localStorage.getItem(key)
    if (newValue === null) localStorage.removeItem(key)
    else localStorage.setItem(key, newValue)
    await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
    })
}

beforeEach(() => {
    localStorage.clear()
    startAuthSession(token(3600), 'refresh-token')
    vi.mocked(refreshAccessToken).mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mounted = vi.fn()
    unmounted = vi.fn()
})

afterEach(async () => {
    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
})

describe('authorization rechecks', () => {
    it('keeps private state mounted during ordinary same-session token rotation', async () => {
        await renderRoute()
        const input = privateInput()
        input.value = 'Edited draft'
        const sessionId = localStorage.getItem(AUTH_SESSION_ID_KEY)

        await remoteWrite(ACCESS_TOKEN, token(7200))
        await remoteWrite(REFRESH_TOKEN, 'rotated-refresh-token')

        expect(privateInput()).toBe(input)
        expect(privateInput().value).toBe('Edited draft')
        expect(mounted).toHaveBeenCalledTimes(1)
        expect(unmounted).not.toHaveBeenCalled()
        expect(refreshAccessToken).not.toHaveBeenCalled()
        expect(localStorage.getItem(AUTH_SESSION_ID_KEY)).toBe(sessionId)
    })

    it('unmounts private content while an expired-token recheck awaits refresh', async () => {
        await renderRoute()
        const pending = deferred()
        vi.mocked(refreshAccessToken).mockReturnValue(pending.promise)

        await remoteWrite(ACCESS_TOKEN, token(-60))

        expect(privateInput()).toBeNull()
        expect(unmounted).toHaveBeenCalledTimes(1)
        expect(container.textContent).toContain('Проверяем авторизацию')

        await act(async () => {
            localStorage.setItem(ACCESS_TOKEN, token(3600))
            pending.resolve('refreshed-access')
        })
        expect(privateInput()).not.toBeNull()
    })

    it('shows recovery after a failed recheck and accepts a later cross-tab refresh', async () => {
        await renderRoute()
        const pending = deferred()
        vi.mocked(refreshAccessToken).mockReturnValue(pending.promise)
        const expired = token(-60)
        const sessionId = localStorage.getItem(AUTH_SESSION_ID_KEY)
        await remoteWrite(ACCESS_TOKEN, expired)

        await act(async () => pending.reject(new Error('Refresh temporarily rejected')))

        expect(privateInput()).toBeNull()
        expect(container.textContent).toContain('Не удалось подтвердить сессию')
        expect(localStorage.getItem(ACCESS_TOKEN)).toBe(expired)
        expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-token')
        expect(localStorage.getItem(AUTH_SESSION_ID_KEY)).toBe(sessionId)

        await remoteWrite(ACCESS_TOKEN, token(3600))

        expect(privateInput()).not.toBeNull()
        expect(container.textContent).not.toContain('Не удалось подтвердить сессию')
    })

    it('removes stale authorization when token decoding fails before refresh', async () => {
        await renderRoute()
        await remoteWrite(ACCESS_TOKEN, 'malformed-token')

        expect(privateInput()).toBeNull()
        expect(container.textContent).toContain('Не удалось подтвердить сессию')
        expect(refreshAccessToken).not.toHaveBeenCalled()
    })

    it('allows an explicit retry after a failed authorization check', async () => {
        localStorage.setItem(ACCESS_TOKEN, token(-60))
        vi.mocked(refreshAccessToken).mockRejectedValueOnce(new Error('Temporary failure'))
        await renderRoute()
        vi.mocked(refreshAccessToken).mockResolvedValueOnce('refreshed-access')
        const retry = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Повторить')

        await act(async () => retry.click())

        expect(privateInput()).not.toBeNull()
        expect(refreshAccessToken).toHaveBeenCalledTimes(2)
    })

    it('ignores an older failed check after a newer token has authorized the route', async () => {
        await renderRoute()
        const pending = deferred()
        vi.mocked(refreshAccessToken).mockReturnValue(pending.promise)
        await remoteWrite(ACCESS_TOKEN, token(-60))
        await remoteWrite(ACCESS_TOKEN, token(3600))
        const input = privateInput()
        expect(input).not.toBeNull()

        await act(async () => pending.reject(new Error('Obsolete refresh failure')))

        expect(privateInput()).toBe(input)
        expect(container.textContent).not.toContain('Не удалось подтвердить сессию')
    })

    it('accepts a newer valid token even before its storage event is delivered', async () => {
        await renderRoute()
        const pending = deferred()
        vi.mocked(refreshAccessToken).mockReturnValue(pending.promise)
        await remoteWrite(ACCESS_TOKEN, token(-60))

        await act(async () => {
            localStorage.setItem(ACCESS_TOKEN, token(3600))
            pending.reject(new Error('Another tab won the refresh race'))
        })

        expect(privateInput()).not.toBeNull()
        expect(container.textContent).not.toContain('Не удалось подтвердить сессию')
    })
})

describe('cross-tab session changes', () => {
    it.each(['authorized', 'refreshing'])('logs out and clears private queries while %s', async (state) => {
        await renderRoute()
        queryClient.setQueryData(['private'], 'Cached private data')
        const cancelQueries = vi.spyOn(queryClient, 'cancelQueries')
        const pending = deferred()
        if (state === 'refreshing') {
            vi.mocked(refreshAccessToken).mockReturnValue(pending.promise)
            await remoteWrite(ACCESS_TOKEN, token(-60))
        }
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)

        await remoteWrite(AUTH_SESSION_ID_KEY, 'logged-out-in-another-tab')

        expect(privateInput()).toBeNull()
        expect(container.textContent).toContain('Public login')
        expect(queryClient.getQueryData(['private'])).toBeUndefined()
        expect(cancelQueries).toHaveBeenCalled()
        expect(localStorage.getItem(AUTH_SESSION_ID_KEY)).toBe('logged-out-in-another-tab')
        if (state === 'refreshing') {
            await act(async () => pending.resolve('Obsolete refresh result'))
            expect(container.textContent).toContain('Public login')
        }
    })
})
