import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import api from '../../api.js'

import RepairRequestListPage from './RepairRequestList.jsx'
import { repairRequestsApiPaths } from './utils/repairApiPaths.js'
import { repairRequestsKeys } from './utils/repair.queries.js'

vi.mock('../../api.js', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))
vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('../customers/utils/customers.queries.js', () => ({
    useGetCustomers: () => ({ data: [] }),
    useGetCustomerObjects: () => ({ data: [] }),
}))
vi.mock('../../pages/utils/exportOrders.js', () => ({ formatFilteringDate: (date) => date || '' }))
vi.mock('./utils/exportRequests.js', () => ({ exportRequestsToExcel: vi.fn() }))

const LIST_URL = repairRequestsApiPaths.listCreate()
const request = (id) => ({
    id,
    request_date: '2026-11-16',
    construction_object: { name: `Object ${id}`, customer_name: 'Customer', address: 'Address' },
    status: 'open',
    location: 'site',
    request_sum: '100.00',
    has_rebillable_items: false,
})
const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}
const apiError = (status, detail, envelope = true) => ({
    response: { status, data: envelope ? { errors: { detail } } : { detail } },
})

let client
let container
let root
let serverRows
let respondToList

const pageData = (page) => ({
    count: serverRows.length,
    results: serverRows.slice((page - 1) * 10, page * 10),
})
const visibleIds = () => [...container.querySelectorAll('tbody tr')]
    .map((row) => Number(row.querySelector('td')?.textContent))
const selectedPage = () => Number(container.querySelector('[aria-current="page"]')?.textContent)
const pageCalls = () => vi.mocked(api.get).mock.calls
    .filter(([url]) => url === LIST_URL)
    .map(([, config]) => Number(config.params.page || 1))
const button = (label, scope = container) => {
    const labeled = scope.querySelector(`[aria-label="${label}"]`)
    return labeled?.matches('button') ? labeled : labeled?.querySelector('button') ?? null
}
const dialog = () => document.querySelector('[role="dialog"]')

const eventually = async (assertion) => {
    let lastError
    for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
            assertion()
            return
        } catch (error) {
            lastError = error
        }
        await act(async () => new Promise((resolve) => setTimeout(resolve, 5)))
    }
    throw lastError
}
const click = async (element) => {
    expect(element).not.toBeNull()
    await act(async () => element.click())
}
const renderList = async (count = 11) => {
    serverRows = Array.from({ length: count }, (_, index) => request(index + 1))
    await act(async () => root.render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <RepairRequestListPage />
            </MemoryRouter>
        </QueryClientProvider>,
    ))
    await eventually(() => expect(visibleIds()).toEqual(serverRows.slice(0, 10).map((row) => row.id)))
}
const goToSecondPage = async () => {
    await click(button('Go to page 2'))
    await eventually(() => {
        expect(selectedPage()).toBe(2)
        expect(visibleIds()).toEqual(serverRows.slice(10, 20).map((row) => row.id))
    })
}
const openDelete = async (id = 11) => {
    const row = [...container.querySelectorAll('tbody tr')]
        .find((element) => Number(element.querySelector('td')?.textContent) === id)
    expect(row).toBeDefined()
    await click(button('Удалить', row))
    expect(dialog()?.textContent).toContain(`Заявка №${id}`)
}
const confirmDelete = async () => {
    const confirm = [...dialog().querySelectorAll('button')].find((element) => element.textContent === 'Удалить')
    await click(confirm)
}
const refreshVisibleList = async () => {
    await act(async () => {
        await client.invalidateQueries({ queryKey: repairRequestsKeys.lists(), refetchType: 'active' })
    })
}

beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.delete).mockReset()
    localStorage.clear()
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    respondToList = (page) => pageData(page)
    vi.mocked(api.get).mockImplementation(async (url, config) => {
        if (url === LIST_URL) return { data: await respondToList(Number(config.params.page || 1)) }
        if (url === '/api/repair/companies/') return { data: [] }
        throw new Error(`Unexpected GET ${url}`)
    })
    vi.mocked(api.delete).mockImplementation(async (url) => {
        const id = Number(url.match(/\/(\d+)\/$/)[1])
        serverRows = serverRows.filter((row) => row.id !== id)
        return { data: null }
    })
})

afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
    localStorage.clear()
})

describe('repair request deletion on a paginated list', () => {
    it('moves from a sole final row to the previous page without fetching the deleted page again', async () => {
        await renderList(11)
        await goToSecondPage()
        const containingKey = repairRequestsKeys.list({ status: 'closed', page: 4 })
        const unrelatedKey = repairRequestsKeys.list({ status: 'open', page: 3 })
        client.setQueryData(containingKey, { count: 32, results: [request(11), request(99)] })
        client.setQueryData(unrelatedKey, { count: 24, results: [request(98)] })
        client.setQueryData(repairRequestsKeys.detail(11), request(11))
        const callsBefore = pageCalls().length

        await openDelete()
        await confirmDelete()

        await eventually(() => {
            expect(selectedPage()).toBe(1)
            expect(visibleIds()).toEqual(Array.from({ length: 10 }, (_, index) => index + 1))
            expect(pageCalls().slice(callsBefore)).toEqual([1])
        })
        expect(api.delete).toHaveBeenCalledExactlyOnceWith(repairRequestsApiPaths.detail(11))
        expect(client.getQueryData(containingKey)).toEqual({ count: 31, results: [request(99)] })
        expect(client.getQueryData(unrelatedKey)).toEqual({ count: 24, results: [request(98)] })
        expect(client.getQueryData(repairRequestsKeys.detail(11))).toBeUndefined()
        for (const [, data] of client.getQueriesData({ queryKey: repairRequestsKeys.lists() })) {
            expect(data.results.some((row) => row.id === 11)).toBe(false)
        }
    })

    it('stays on the last page and refreshes it when another row remains', async () => {
        await renderList(12)
        await goToSecondPage()
        const callsBefore = pageCalls().length

        await openDelete()
        await confirmDelete()

        await eventually(() => {
            expect(selectedPage()).toBe(2)
            expect(visibleIds()).toEqual([12])
            expect(pageCalls().slice(callsBefore)).toEqual([2])
        })
        const activePage = client.getQueriesData({ queryKey: repairRequestsKeys.lists() })
            .find(([key]) => key[2].page === 2)[1]
        expect(activePage.count).toBe(11)
        expect(activePage.results).toEqual([request(12)])
    })

    it('keeps the current page, cached row and confirmation dialog when deletion fails', async () => {
        await renderList(11)
        await goToSecondPage()
        vi.mocked(api.delete).mockRejectedValueOnce(apiError(500, 'Не удалось удалить заявку'))
        const callsBefore = pageCalls().length

        await openDelete()
        await confirmDelete()

        await eventually(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain('Не удалось'))
        // Let a mistakenly closed MUI dialog finish its exit transition.
        await act(async () => new Promise((resolve) => setTimeout(resolve, 300)))
        expect(selectedPage()).toBe(2)
        expect(visibleIds()).toEqual([11])
        expect(dialog()?.textContent).toContain('Заявка №11')
        expect(pageCalls()).toHaveLength(callsBefore)
        const activePage = client.getQueriesData({ queryKey: repairRequestsKeys.lists() })
            .find(([key]) => key[2].page === 2)[1]
        expect(activePage).toEqual({ count: 11, results: [request(11)] })
    })

    it('prevents page and applied-filter changes while deletion is pending', async () => {
        const pending = deferred()
        await renderList(11)
        await goToSecondPage()
        vi.mocked(api.delete).mockImplementationOnce(async () => {
            await pending.promise
            serverRows = serverRows.filter((row) => row.id !== 11)
            return { data: null }
        })
        await openDelete()
        await confirmDelete()
        const callsBefore = pageCalls().length

        await eventually(() => expect(button('Go to page 1').disabled).toBe(true))
        await click(button('Go to page 1'))
        await click(button('Сбросить'))
        await click(button('Применить'))
        expect(selectedPage()).toBe(2)
        expect(pageCalls()).toHaveLength(callsBefore)
        expect(dialog()).not.toBeNull()

        await act(async () => pending.resolve())
        await eventually(() => expect(selectedPage()).toBe(1))
    })

    it('discards an older in-flight page response after a successful deletion', async () => {
        await renderList(11)
        await goToSecondPage()
        const oldResponse = deferred()
        const oldPage = pageData(2)
        respondToList = (page) => page === 2 ? oldResponse.promise : pageData(page)
        let refresh
        await act(async () => {
            refresh = client.refetchQueries({ queryKey: repairRequestsKeys.lists(), type: 'active' })
        })
        await openDelete()
        await confirmDelete()
        await eventually(() => expect(selectedPage()).toBe(1))

        await act(async () => {
            oldResponse.resolve(oldPage)
            await refresh
        })

        expect(visibleIds()).not.toContain(11)
        for (const [, data] of client.getQueriesData({ queryKey: repairRequestsKeys.lists() })) {
            expect(data.results.some((row) => row.id === 11)).toBe(false)
        }
    })
})

describe('repair request pagination after concurrent changes', () => {
    it.each([
        ['localized detail', apiError(404, 'Неправильная страница')],
        ['standard DRF detail', apiError(404, 'Invalid page.', false)],
    ])('recovers from an out-of-range page with %s', async (_label, error) => {
        await renderList(11)
        await goToSecondPage()
        serverRows = serverRows.slice(0, 10)
        respondToList = (page) => {
            if (page === 2) throw error
            return pageData(page)
        }

        await refreshVisibleList()

        await eventually(() => {
            expect(selectedPage()).toBe(1)
            expect(visibleIds()).toEqual(Array.from({ length: 10 }, (_, index) => index + 1))
        })
        expect(api.delete).not.toHaveBeenCalled()
    })

    it('clamps the current page when a successful empty response supplies a reduced count', async () => {
        await renderList(11)
        await goToSecondPage()
        serverRows = serverRows.slice(0, 6)

        await refreshVisibleList()

        await eventually(() => {
            expect(selectedPage()).toBe(1)
            expect(visibleIds()).toEqual([1, 2, 3, 4, 5, 6])
        })
        expect(pageCalls().slice(-2)).toEqual([2, 1])
    })

    it.each([
        ['a missing resource', apiError(404, 'Not found.')],
        ['a network failure', new Error('Network unavailable')],
    ])('does not mistake %s for an invalid page', async (_label, error) => {
        await renderList(11)
        await goToSecondPage()
        const callsBefore = pageCalls().length
        respondToList = () => { throw error }

        await refreshVisibleList()

        await eventually(() => {
            expect(container.querySelector('[role="alert"]')).not.toBeNull()
            expect(visibleIds()).toEqual([])
            expect(selectedPage()).toBe(2)
            expect(pageCalls().slice(callsBefore)).toEqual([2])
        })
        expect(api.delete).not.toHaveBeenCalled()
    })
})
