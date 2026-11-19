import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import api from '../../api.js'
import { AuthContext } from '../../pages/auth/context/useAuth.js'

import { qualityPassportKeys } from '../orders/utils/qualityPassports.queries.js'

import CatalogPage from './Catalog.jsx'
import { exportQualityPassport } from './utils/exportQualityPassport.jsx'

vi.mock('../../api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('./utils/exportQualityPassport.jsx', () => ({
    exportQualityPassport: vi.fn(),
    qualityPassportPdfFilename: vi.fn(),
    requireCompleteQualityPassport: (passport) => passport,
}))

const PASSPORTS_URL = '/api/catalog/quality-passports/'
const STATE_URL = `${PASSPORTS_URL}state/`
const TODAY = '2026-11-02'
const MIN_ISSUE_DATE = '2026-11-01'
const PREVIOUS = {
    id: 42,
    number: 54672,
    issue_date: '2026-10-31',
    batch_number: '28.999',
    production_date: '2026-10-30',
    quantity: '3.000',
}
const BULK_PRODUCT = {
    id: 1,
    name: 'Mixity',
    is_piece_based: false,
    product_unit: { unit: { title: 'ton' }, value: 1 },
}
const PAYLOAD = {
    product_id: BULK_PRODUCT.id,
    expected_latest_passport_id: PREVIOUS.id,
    number: 54680,
    suggested_next_passport_number: 54680,
    issue_date: TODAY,
    batch_number: '29.000',
    production_date: TODAY,
    quantity: '2.000',
}
const stateFor = (passport, used = '0.000', remaining = passport.quantity, suggestion = PAYLOAD.number) => ({
    suggested_next_passport_number: suggestion,
    passport,
    latest_passport_id: passport.id,
    is_latest: true,
    used_quantity: used,
    remaining_quantity: remaining,
    projected_used_quantity: null,
    projected_exceeded_quantity: null,
    can_issue_new_passport: false,
})

let client
let container
let root
let product
let latestState
let fetchLatestState

const dialog = () => document.querySelector('[role="dialog"]')
const dialogButton = (label) => [...dialog().querySelectorAll('button')].find((button) => button.textContent === label)
const input = (label) => {
    const field = [...dialog().querySelectorAll('label')].find((element) => element.textContent.startsWith(label))
    return field ? document.getElementById(field.htmlFor) : dialog().querySelector(`input[aria-label="${label}"]`)
}
const renewButton = () => container.querySelector('[data-testid="AutorenewOutlinedIcon"]')?.closest('button')
const passportDetailsButton = (number) => container.querySelector(`button[aria-label="Сведения о паспорте качества № ${number}"]`)
const stateCalls = () => vi.mocked(api.get).mock.calls.filter(([url]) => url === STATE_URL)
const alerts = () => [...document.querySelectorAll('[role="alert"]')].map((alert) => alert.textContent)
const eventually = async (assertion) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
            assertion()
            return
        } catch {
            await act(async () => new Promise((resolve) => setTimeout(resolve, 5)))
        }
    }
    assertion()
}
const click = async (element) => {
    expect(element).toBeTruthy()
    await act(async () => element.click())
}
const change = async (label, value) => {
    const field = input(label)
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    expect(field).toBeTruthy()
    await act(async () => {
        setValue.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
    })
}
const save = () => click(dialogButton('Выпустить паспорт'))
const renderCatalog = async (permissions = ['catalog.view_product', 'catalog.add_qualitypassport']) => {
    const auth = { hasPermission: (permission) => permissions.includes(permission) }
    await act(async () => root.render(
        <QueryClientProvider client={client}>
            <AuthContext.Provider value={auth}>
                <MemoryRouter>
                    <CatalogPage />
                </MemoryRouter>
            </AuthContext.Provider>
        </QueryClientProvider>,
    ))
    await eventually(() => expect(passportDetailsButton(latestState.passport.number)).toBeTruthy())
}
const openIssue = async () => {
    await eventually(() => expect(renewButton()?.disabled).toBe(false))
    await click(renewButton())
    expect(dialog()?.textContent).toContain('Создание паспорта качества')
    await eventually(() => expect(dialogButton('Выпустить паспорт')?.disabled).toBe(false))
}
const fillIssue = async ({ number = PAYLOAD.number, batchNumber = PAYLOAD.batch_number, quantity = PAYLOAD.quantity } = {}) => {
    await change('Паспорт №', String(number))
    await change('Номер партии', batchNumber)
    await change('Количество, т', quantity)
}
const mockIssueSuccess = () => {
    vi.mocked(api.post).mockImplementation(async (_url, payload) => {
        const { number, issue_date, batch_number, production_date, quantity } = payload
        const passport = { id: 43, number, issue_date, batch_number, production_date, quantity }
        latestState = stateFor(passport, undefined, undefined, number + 1)
        return { data: { ...passport, product, specifications: [] } }
    })
}
const apiError = (status, data) => ({ response: { status, data } })

beforeEach(() => {
    vi.setSystemTime(new Date('2026-11-02T01:00:00Z'))
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
    vi.mocked(exportQualityPassport).mockReset()
    product = BULK_PRODUCT
    latestState = stateFor(PREVIOUS, '1.200', '1.800')
    fetchLatestState = async () => {
        const { is_piece_based, product_unit } = product
        return { data: { ...latestState, product: { is_piece_based, product_unit } } }
    }
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.mocked(api.get).mockImplementation(async (url, config) => {
        if (url === '/api/catalog/products/') return { data: [{ id: product.id, name: product.name }] }
        if (url === STATE_URL) {
            expect(config.params).toEqual({ source: 'catalog', product_id: product.id })
            return fetchLatestState()
        }
        if (url === `${PASSPORTS_URL}${latestState.passport.id}/`) {
            return { data: { ...latestState.passport, specifications: [], product } }
        }
        throw new Error(`Unexpected GET ${url}`)
    })
})

afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    onlineManager.setOnline(true)
    container.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
})

it('defaults both dates to today, validates the calendar bounds and accepts the first available issue date', async () => {
    mockIssueSuccess()
    await renderCatalog()
    await openIssue()
    expect(dialog().textContent).toContain('№ 54672 от 31.10.2026')
    expect(dialog().textContent).toContain(PREVIOUS.batch_number)
    expect(input('Паспорт №').value).toBe(String(PAYLOAD.number))
    expect(input('Номер партии').value).toBe(PAYLOAD.batch_number)
    expect(input('Дата паспорта')).toMatchObject({ value: TODAY, min: MIN_ISSUE_DATE, max: TODAY })
    expect(input('Дата изготовления')).toMatchObject({ value: TODAY, max: TODAY })
    await fillIssue()

    for (const invalidIssueDate of [PREVIOUS.issue_date, '2026-11-03', '']) {
        await change('Дата паспорта', invalidIssueDate)
        await save()
        expect(input('Дата паспорта').getAttribute('aria-invalid')).toBe('true')
        expect(api.post).not.toHaveBeenCalled()
    }
    await change('Дата паспорта', MIN_ISSUE_DATE)
    await change('Дата изготовления', TODAY)
    await save()
    expect(input('Дата изготовления').getAttribute('aria-invalid')).toBe('true')
    expect(api.post).not.toHaveBeenCalled()

    await change('Дата изготовления', PREVIOUS.issue_date)
    await save()
    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, {
        ...PAYLOAD,
        issue_date: MIN_ISSUE_DATE,
        production_date: PREVIOUS.issue_date,
    })
})

it('does not offer issuance when the latest passport was issued today', async () => {
    latestState = stateFor({ ...PREVIOUS, issue_date: TODAY })
    await renderCatalog()

    expect(renewButton()?.disabled).toBe(true)
    await click(renewButton())
    expect(dialog()).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
})

it('requires the Catalog add permission even with order and Catalog view permissions', async () => {
    await renderCatalog(['catalog.view_product', 'catalog.view_qualitypassport', 'order.view_order', 'order.change_order'])
    expect(renewButton() && !renewButton().disabled).toBeFalsy()
    if (renewButton()) await click(renewButton())

    expect(dialog()).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
})

it('rejects zero, excessive decimal precision and non-multiples of the bulk step', async () => {
    mockIssueSuccess()
    await renderCatalog()
    await openIssue()
    await fillIssue({ quantity: '0' })

    for (const invalidQuantity of ['0', '0.0101', '-0.010', '0.011']) {
        await change('Количество, т', invalidQuantity)
        await save()
        expect(input('Количество, т').getAttribute('aria-invalid')).toBe('true')
        expect(api.post).not.toHaveBeenCalled()
    }
    await change('Количество, т', '0,030')
    await save()
    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, { ...PAYLOAD, quantity: '0.030' })
})

it.each([true, false])('uses the configured piece weight with is_piece_based=%s', async (isPieceBased) => {
    product = { ...product, is_piece_based: isPieceBased, product_unit: { unit: { title: 'piece' }, value: 12 } }
    mockIssueSuccess()
    await renderCatalog()
    await openIssue()
    await fillIssue({ quantity: '0.037' })
    await save()

    expect(input('Количество, т').getAttribute('aria-invalid')).toBe('true')
    expect(api.post).not.toHaveBeenCalled()

    await change('Количество, т', '0,036')
    await save()
    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, { ...PAYLOAD, quantity: '0.036' })
})

it('issues the passport, invalidates the quality-passport cache and refreshes the Catalog row', async () => {
    mockIssueSuccess()
    const orderKey = qualityPassportKeys.state({ productId: 99, orderId: 12, targetStatus: 'draft' })
    const orderState = stateFor(PREVIOUS, '1.200', '1.800')
    client.setQueryData(orderKey, orderState)
    await renderCatalog()
    await openIssue()
    const requestCount = stateCalls().length
    const respondToRefresh = fetchLatestState
    let finishRefresh
    fetchLatestState = () => new Promise((resolve) => { finishRefresh = () => resolve(respondToRefresh()) })
    const { suggested_next_passport_number: suggestion, ...manualPayload } = PAYLOAD
    const edited = { ...manualPayload, number: 70001, batch_number: '28.340' }
    expect(input('Паспорт №').value).toBe(String(suggestion))
    await fillIssue({ number: ' 70001 ', batchNumber: ' 28,34 ' })
    await save()

    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, edited)
    await eventually(() => {
        expect(dialog()).toBeNull()
        expect(alerts()).toEqual(expect.arrayContaining([expect.stringContaining('70001')]))
        expect(passportDetailsButton(edited.number)).toBeTruthy()
        expect(passportDetailsButton(PREVIOUS.number)).toBeNull()
        expect(stateCalls()).toHaveLength(requestCount + 1)
    })
    expect(client.getQueryState(orderKey).isInvalidated).toBe(true)
    expect(client.getQueryData(orderKey)).toEqual(orderState)
    await act(async () => finishRefresh())
})

it('shows validation errors on the relevant fields and keeps the dialog contents', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(400, {
        errors: { number: ['Паспорт с таким номером уже существует.'], quantity: ['Сервер отклонил количество.'] },
        messages: ['Number: Паспорт с таким номером уже существует.', 'Quantity: Сервер отклонил количество.'],
    }))
    await renderCatalog()
    await openIssue()
    await fillIssue()
    await save()

    expect(input('Паспорт №')).toMatchObject({ value: String(PAYLOAD.number) })
    expect(input('Паспорт №').getAttribute('aria-invalid')).toBe('true')
    expect(dialog().textContent).toContain('Паспорт с таким номером уже существует.')
    expect(input('Количество, т').getAttribute('aria-invalid')).toBe('true')
    expect(dialog().textContent).toContain('Сервер отклонил количество.')
    expect(dialogButton('Выпустить паспорт').disabled).toBe(false)
})

it.each([
    [403, /нет прав/i],
    [404, /не найден/i],
    [500, /не удалось выпустить/i],
    [null, /не удалось связаться/i],
])('allows retry and shows the expected feedback for a %s request failure', async (status, message) => {
    vi.mocked(api.post).mockRejectedValueOnce(status ? apiError(status, {}) : new Error('Network error'))
    await renderCatalog()
    await openIssue()
    await fillIssue()
    await save()

    expect(alerts()).toEqual(expect.arrayContaining([expect.stringMatching(message)]))
    expect(dialogButton('Выпустить паспорт').disabled).toBe(false)
    expect(passportDetailsButton(PREVIOUS.number)).toBeTruthy()
})

it('keeps the original guard ID during a background refresh and refreshes on a conflict before asking the user to reopen', async () => {
    const replacement = { ...PREVIOUS, id: 43, number: 54674, issue_date: MIN_ISSUE_DATE }
    const catalogKey = qualityPassportKeys.state({ productId: product.id, source: 'catalog' })
    vi.mocked(api.post).mockRejectedValueOnce(apiError(409, { errors: { detail: 'Действующий паспорт изменился.' } }))
    await renderCatalog()
    await openIssue()
    await fillIssue()

    latestState = stateFor(replacement, undefined, undefined, 54681)
    await act(async () => client.refetchQueries({ queryKey: qualityPassportKeys.all, type: 'active' }))
    await eventually(() => expect(passportDetailsButton(replacement.number)).toBeTruthy())
    const requestCount = stateCalls().length
    const respondToRefresh = fetchLatestState
    let finishRefresh
    fetchLatestState = () => new Promise((resolve) => { finishRefresh = () => resolve(respondToRefresh()) })
    await act(async () => onlineManager.setOnline(false))
    await save()

    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, PAYLOAD)
    await eventually(() => {
        expect(dialog()).toBeNull()
        expect(renewButton()?.disabled).toBe(true)
        expect(alerts()).toEqual(expect.arrayContaining([expect.stringMatching(/откройте/i)]))
        expect(client.getQueryState(catalogKey).fetchStatus).toBe('paused')
        expect(stateCalls()).toHaveLength(requestCount)
    })
    await click(renewButton())
    expect(dialog()).toBeNull()

    await act(async () => onlineManager.setOnline(true))
    await eventually(() => {
        expect(stateCalls()).toHaveLength(requestCount + 1)
        expect(renewButton()?.disabled).toBe(true)
    })
    await act(async () => finishRefresh())
    await openIssue()
    expect(dialog().textContent).toContain(String(replacement.number))
    expect(input('Паспорт №').value).toBe('54681')
})

it('refreshes a globally occupied suggestion while keeping the same product passport and batch', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(409, { errors: { code: 'passport_number_conflict' } }))
    await renderCatalog()
    await openIssue()
    await fillIssue()

    latestState = stateFor(PREVIOUS, '1.200', '1.800', PAYLOAD.number + 1)
    await act(async () => client.refetchQueries({ queryKey: qualityPassportKeys.all, type: 'active' }))
    expect(input('Паспорт №').value).toBe(String(PAYLOAD.number))
    await save()
    expect(api.post).toHaveBeenCalledExactlyOnceWith(PASSPORTS_URL, PAYLOAD)
    await eventually(() => expect(alerts()).toEqual(expect.arrayContaining([expect.stringMatching(/номер паспорта уже занят/i)])))
    await openIssue()
    expect(passportDetailsButton(PREVIOUS.number)).toBeTruthy()
    expect(input('Паспорт №').value).toBe(String(PAYLOAD.number + 1))
    expect(input('Номер партии').value).toBe(PAYLOAD.batch_number)
})

it('blocks duplicate submissions and closing while issuance is pending', async () => {
    let rejectRequest
    vi.mocked(api.post).mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject }))
    await renderCatalog()
    await openIssue()
    await fillIssue()

    const submit = dialogButton('Выпустить паспорт')
    await act(async () => {
        submit.click()
        submit.click()
    })
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(submit.disabled).toBe(true)
    expect(dialog().querySelector('[role="progressbar"]')).toBeTruthy()
    expect(dialogButton('Отмена').disabled).toBe(true)
    await click(dialogButton('Отмена'))
    await act(async () => dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(dialog()).toBeTruthy()

    await act(async () => rejectRequest(new Error('Network error')))
    await click(dialogButton('Отмена'))
    await eventually(() => expect(dialog()).toBeNull())
})

it.each([
    ['Catalog issuance', ['catalog.add_qualitypassport'], false],
    ['order view and export', ['order.view_order', 'order.export_order'], true],
])('hides Catalog PDF actions when the user has %s permission only', async (_role, permissions, renewDisabled) => {
    await renderCatalog(['catalog.view_product', ...permissions])

    expect(renewButton()?.disabled).toBe(renewDisabled)
    expect(container.querySelector('button[aria-label="Просмотр паспорта"]')).toBeNull()
    expect(container.querySelector('[data-testid="FileDownloadIcon"]')).toBeNull()
})

it('allows passport readers to preview and download without order or issuance permissions', async () => {
    const previewWindow = { document: { title: '', body: { textContent: '' } }, closed: false, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(previewWindow)
    await renderCatalog(['catalog.view_product', 'catalog.view_qualitypassport'])
    expect(renewButton()?.disabled).toBe(true)

    const preview = () => container.querySelector('button[aria-label="Просмотр паспорта"]')
    const download = () => container.querySelector('[data-testid="FileDownloadIcon"]')?.closest('button')
    const fullPassport = { ...PREVIOUS, product, specifications: [] }
    await click(preview())
    await eventually(() => expect(exportQualityPassport).toHaveBeenCalledWith(fullPassport, {
        mode: 'preview', previewWindow, fileHandle: null,
    }))
    expect(window.open).toHaveBeenCalledExactlyOnceWith('', '_blank')

    await eventually(() => expect(download()).toBeTruthy())
    await click(download())
    await eventually(() => expect(exportQualityPassport).toHaveBeenCalledWith(fullPassport, {
        mode: 'download', previewWindow: null, fileHandle: null,
    }))
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === `${PASSPORTS_URL}${PREVIOUS.id}/`)).toHaveLength(2)
})
