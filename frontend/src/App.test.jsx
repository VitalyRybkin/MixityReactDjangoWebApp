// @vitest-environment jsdom
import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'

import { getAuthSessionGeneration, startAuthSession } from './api.js'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import TopBar from './layouts/TopBar.jsx'
import { AuthContext } from './pages/auth/context/useAuth.js'

const routerRef = vi.hoisted(() => ({ current: null }))
vi.mock('react-router-dom', async (importOriginal) => {
    const original = await importOriginal()
    return {
        ...original,
        createBrowserRouter: (...args) => {
            routerRef.current = original.createBrowserRouter(...args)
            return routerRef.current
        },
    }
})
vi.mock('./pages/Login.jsx', () => ({ default: () => <div>Public login</div> }))

let root
let container
let queryClient

// Initialize the real browser router on the public logout route.
window.history.replaceState(null, '', '/logout')
const { default: App } = await import('./App.jsx')

afterEach(async () => {
    if (root) await act(async () => root.unmount())
    routerRef.current?.dispose()
    queryClient?.clear()
    container?.remove()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
})

it('the logout route invalidates credentials before cancelling and clearing private queries', async () => {
    startAuthSession('old-access', 'old-refresh')
    const generation = getAuthSessionGeneration()
    queryClient = new QueryClient()
    queryClient.setQueryData(['private'], 'Cached private data')
    const cancel = queryClient.cancelQueries.bind(queryClient)
    const cancelQueries = vi.spyOn(queryClient, 'cancelQueries').mockImplementation((...args) => {
        expect(getAuthSessionGeneration()).not.toBe(generation)
        expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull()
        expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull()
        return cancel(...args)
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await Promise.resolve(act(async () => {
        root.render(<StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>)
    }))

    expect(cancelQueries).toHaveBeenCalled()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(window.location.pathname).toBe('/login')
    expect(container.textContent).toContain('Public login')
})

it('the visible logout button enters the session-cleanup route', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const auth = { user: { username: 'Tester' }, hasPermission: () => false, hasAnyPermission: () => false }

    await Promise.resolve(act(async () => {
        root.render(
            <AuthContext.Provider value={auth}>
                <MemoryRouter>
                    <Routes>
                        <Route path="/" element={<TopBar />} />
                        <Route path="/logout" element={<div>Session-cleanup route</div>} />
                        <Route path="/login" element={<div>Login without cleanup</div>} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>,
        )
    }))
    const logout = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Выйти')

    await act(async () => logout.click())

    expect(container.textContent).toContain('Session-cleanup route')
})
