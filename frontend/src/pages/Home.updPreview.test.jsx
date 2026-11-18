import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { viewUpd } from '../features/orders/utils/orders.queries.js'

import Home from './Home.jsx'

vi.mock('@mui/x-data-grid', () => ({ DataGrid: () => null }))
vi.mock('../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('../components/FilterSummary.jsx', () => ({ default: () => null }))
vi.mock('../components/PageHeader.jsx', () => ({ default: () => null }))
vi.mock('./components/CustomPagination.jsx', () => ({ default: () => null }))
vi.mock('./components/FilterSidebar.jsx', () => ({ default: () => null }))
vi.mock('./auth/components/Can.jsx', () => ({ default: () => null }))
vi.mock('./auth/context/useAuth.js', () => ({ useAuth: () => ({ hasPermission: () => true }) }))
vi.mock('../features/customers/utils/customers.queries.js', () => ({
    useGetCustomers: () => ({ data: [] }),
}))
vi.mock('../features/orders/hooks/useOrdersFilters.js', () => ({
    useOrdersFilters: () => ({ formattedFilters: {}, draftFilters: {} }),
}))
vi.mock('../features/orders/hooks/useDeleteOrderFlow.js', () => ({
    useDeleteOrderFlow: () => ({ orderToDelete: null, setOrderToDelete: () => {}, isDeleting: false }),
}))
vi.mock('../features/orders/utils/orders.queries.js', () => ({
    useGetOrders: () => ({ data: [], isPending: false, isError: false }),
    useGetOrderResources: () => ({ data: { warehouses: [] } }),
    useExportOrders: () => ({ isFetching: false }),
    useUploadUpd: () => ({ isPending: false }),
    viewUpd: vi.fn(),
}))
vi.mock('./utils/exportOrders.js', () => ({
    formatFilteringDate: () => '',
    prepareOrdersExcelFile: vi.fn(),
}))
vi.mock('./utils/exportPowerOfAttorney.jsx', () => ({
    getAssignedDriverName: vi.fn(),
    preparePowerOfAttorneyFiles: vi.fn(),
}))
vi.mock('./utils/exportQualityPassports.jsx', () => ({ prepareQualityPassportFiles: vi.fn() }))
vi.mock('../features/orders/components/OrderMobileList.jsx', () => ({
    default: ({ onViewUpd }) => (
        <button type="button" onClick={() => { previewPromise = onViewUpd(42) }}>Preview UPD</button>
    ),
}))

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
let container
let root
let previewTab
let previewPromise
let consoleError
let timeout

const renderHome = async () => {
    await act(async () => root.render(<MemoryRouter><Home /></MemoryRouter>))
}
const startPreview = async () => {
    const button = [...container.querySelectorAll('button')].find((element) => element.textContent === 'Preview UPD')
    await act(async () => button.click())
}
const preview = async () => {
    await startPreview()
    await act(async () => previewPromise)
}
const expectSnackbar = (message, severity) => {
    const alerts = document.querySelectorAll('[role="alert"]')
    expect(alerts).toHaveLength(1)
    expect(alerts[0].querySelector('.MuiAlert-message').textContent).toBe(message)
    expect(alerts[0].classList.contains(`MuiAlert-filled${severity}`)).toBe(true)
}

beforeEach(() => {
    vi.mocked(viewUpd).mockReset()
    previewPromise = undefined
    previewTab = {
        closed: false,
        opener: {},
        document: { title: '', body: { textContent: '' } },
        location: { replace: vi.fn() },
        close: vi.fn(() => { previewTab.closed = true }),
    }
    vi.spyOn(window, 'open').mockImplementation(() => previewTab)
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    timeout = vi.spyOn(window, 'setTimeout')
    URL.createObjectURL = vi.fn(() => 'blob:upd-preview')
    URL.revokeObjectURL = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    timeout.mock.calls.forEach(([, delay], index) => {
        if (delay === 5 * 60 * 1000) window.clearTimeout(timeout.mock.results[index].value)
    })
    container.remove()
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    vi.restoreAllMocks()
})

it.each([
    ['an empty Blob', () => new Blob([])],
    ['a non-Blob response', () => ({ size: 12 })],
])('closes the preview and reports the original invalid-response error for %s', async (_description, response) => {
    vi.mocked(viewUpd).mockResolvedValue(response())
    await renderHome()

    await preview()

    expect(previewTab.close).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)
    const [message, error] = consoleError.mock.calls[0]
    expect(message).toBe('Ошибка просмотра УПД:')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Пустой ответ УПД')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(previewTab.location.replace).not.toHaveBeenCalled()
    expectSnackbar('Не удалось открыть УПД.', 'Error')
})

it('preserves request rejection identity and error feedback while closing the reserved tab', async () => {
    const failure = new Error('Network unavailable')
    vi.mocked(viewUpd).mockRejectedValue(failure)
    await renderHome()

    await preview()

    expect(viewUpd).toHaveBeenCalledExactlyOnceWith(42)
    expect(previewTab.close).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledExactlyOnceWith('Ошибка просмотра УПД:', failure)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expectSnackbar('Не удалось открыть УПД.', 'Error')
})

it('keeps the blocked-popup warning and does not request a document', async () => {
    vi.mocked(window.open).mockReturnValue(null)
    await renderHome()

    await preview()

    expect(viewUpd).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expectSnackbar('Браузер заблокировал окно просмотра УПД. Разрешите всплывающие окна.', 'Warning')
})

it('opens a valid Blob and preserves its five-minute preview URL lifetime', async () => {
    const blob = new Blob(['PDF data'], { type: 'application/pdf' })
    vi.mocked(viewUpd).mockResolvedValue(blob)
    await renderHome()

    await preview()

    expect(window.open).toHaveBeenCalledExactlyOnceWith('', '_blank')
    expect(previewTab.opener).toBeNull()
    expect(previewTab.document.title).toBe('УПД заявки № 42')
    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(blob)
    expect(previewTab.location.replace).toHaveBeenCalledExactlyOnceWith('blob:upd-preview')
    expect(previewTab.close).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    const cleanup = timeout.mock.calls.find(([, delay]) => delay === 5 * 60 * 1000)
    expect(cleanup).toBeDefined()
    cleanup[0]()
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:upd-preview')
    expect(consoleError).not.toHaveBeenCalled()
    expect(document.querySelector('[role="alert"]')).toBeNull()
})

it('releases a valid Blob URL immediately if its reserved tab was closed during loading', async () => {
    let resolveRequest
    vi.mocked(viewUpd).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    await renderHome()
    await startPreview()
    expect(previewTab.document.body.textContent).toBe('Загрузка УПД…')
    previewTab.closed = true

    await act(async () => resolveRequest(new Blob(['PDF data'])))
    await act(async () => previewPromise)

    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:upd-preview')
    expect(previewTab.location.replace).not.toHaveBeenCalled()
    expect(previewTab.close).not.toHaveBeenCalled()
    expect(timeout.mock.calls.some(([, delay]) => delay === 5 * 60 * 1000)).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()
    expect(document.querySelector('[role="alert"]')).toBeNull()
})
