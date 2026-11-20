import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import api from '../api.js'

import ObjectDetailWithContactList from './ObjectDetailWithContactList.jsx'

const mocks = vi.hoisted(() => ({
    contactsProps: null,
    confirmProps: null,
    showSnackbar: vi.fn(),
}))

vi.mock('../api.js', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../hooks/useSnackbar.js', () => ({
    default: () => ({ snack: { open: false }, showSnackbar: mocks.showSnackbar, closeSnackbar: vi.fn() }),
}))
vi.mock('./AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('./ContactCreateUpdate.jsx', () => ({ default: () => null }))
vi.mock('./ContactsList.jsx', () => ({
    default: (props) => {
        mocks.contactsProps = props
        return null
    },
}))
vi.mock('./ui/feedback/ConfirmDialog.jsx', () => ({
    default: (props) => {
        mocks.confirmProps = props
        return null
    },
}))
vi.mock('./ui/feedback/AppSnackbar.jsx', () => ({ default: () => null }))

const FIRST_PHONE = '+79990000001'
const SECOND_PHONE = '+79990000002'
const EXTRA_PHONE = '+79990000003'
const phones = (...numbers) => numbers.map((phoneNumber) => ({ phoneNumber }))
const apiError = (message) => ({ response: { data: { detail: message } } })

let container
let root
let queryClient
let serverContact
let listCalls
let failListCall

const cloneContact = () => ({ ...serverContact, phoneNumbers: serverContact.phoneNumbers.map((phone) => ({ ...phone })) })
const settleQueries = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
const waitForNotifications = (count) => vi.waitFor(() => expect(mocks.showSnackbar).toHaveBeenCalledTimes(count))

const renderDetail = async () => {
    await act(async () =>
        root.render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <ObjectDetailWithContactList
                        id={5}
                        label="Заказчик"
                        editTo={(id) => `/customers/${id}/edit`}
                        entityUrl={(id) => `/api/customers/${id}/`}
                        contactsUrl={(id) => `/api/customers/${id}/contacts/`}
                        ownerType="customer"
                        ownerId={5}
                        fields={(entity) => [{ label: 'Название', value: entity.name }]}
                    />
                </QueryClientProvider>
            </MemoryRouter>,
        ),
    )
    await settleQueries()
    expect(mocks.contactsProps).not.toBeNull()
}

beforeEach(() => {
    vi.clearAllMocks()
    mocks.contactsProps = null
    mocks.confirmProps = null
    listCalls = 0
    failListCall = null
    serverContact = { id: 11, firstName: 'Иван', lastName: 'Иванов', phoneNumbers: phones(FIRST_PHONE, SECOND_PHONE) }
    api.get.mockImplementation(async (url) => {
        if (url === '/api/customers/5/') return { data: { id: 5, name: 'Заказчик' } }
        if (url === '/api/contacts/11/') return { data: cloneContact() }
        if (url === '/api/customers/5/contacts/') {
            listCalls += 1
            if (listCalls === failListCall) throw apiError('Не удалось обновить контакты')
            return { data: [cloneContact()] }
        }
        throw new Error(`Unexpected GET ${url}`)
    })
    api.patch.mockImplementation(async (_url, payload) => {
        serverContact.phoneNumbers = payload.phoneNumbers.map((phone) => ({ ...phone }))
        return { data: cloneContact() }
    })
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
})

it('deletes a phone from fresh contact data and preserves concurrently added numbers', async () => {
    await renderDetail()
    serverContact.phoneNumbers.push({ phoneNumber: EXTRA_PHONE })

    await act(async () => {
        mocks.contactsProps.onDeletePhone(11, FIRST_PHONE)
        await waitForNotifications(1)
    })

    expect(api.patch).toHaveBeenCalledExactlyOnceWith('/api/contacts/11/', {
        phoneNumbers: phones(SECOND_PHONE, EXTRA_PHONE),
    })
    expect(mocks.showSnackbar).toHaveBeenCalledExactlyOnceWith('Телефон удалён', 'success')
    expect(mocks.contactsProps.isDeletingPhone(11, FIRST_PHONE)).toBe(false)
    expect(listCalls).toBe(2)
})

it('reports a failed phone update and still processes the next queued deletion', async () => {
    await renderDetail()
    api.patch.mockRejectedValueOnce(apiError('Не удалось сохранить контакт'))

    await act(async () => {
        mocks.contactsProps.onDeletePhone(11, FIRST_PHONE)
        mocks.contactsProps.onDeletePhone(11, SECOND_PHONE)
        await waitForNotifications(2)
    })

    expect(api.patch.mock.calls.map(([, payload]) => payload.phoneNumbers)).toEqual([
        phones(SECOND_PHONE),
        phones(FIRST_PHONE),
    ])
    expect(mocks.showSnackbar.mock.calls).toEqual([
        ['Не удалось сохранить контакт', 'error'],
        ['Телефон удалён', 'success'],
    ])
    expect(mocks.contactsProps.isDeletingPhone(11, FIRST_PHONE)).toBe(false)
    expect(mocks.contactsProps.isDeletingPhone(11, SECOND_PHONE)).toBe(false)
})

it('catches a real query-refetch rejection and continues the per-contact deletion queue', async () => {
    await renderDetail()
    serverContact.phoneNumbers.push({ phoneNumber: EXTRA_PHONE })
    failListCall = 2

    await act(async () => {
        mocks.contactsProps.onDeletePhone(11, FIRST_PHONE)
        mocks.contactsProps.onDeletePhone(11, SECOND_PHONE)
        await waitForNotifications(2)
    })
    await settleQueries()

    expect(api.patch.mock.calls.map(([, payload]) => payload.phoneNumbers)).toEqual([
        phones(SECOND_PHONE, EXTRA_PHONE),
        phones(EXTRA_PHONE),
    ])
    expect(mocks.showSnackbar.mock.calls).toEqual([
        ['Не удалось обновить контакты', 'error'],
        ['Телефон удалён', 'success'],
    ])
    expect(serverContact.phoneNumbers).toEqual(phones(EXTRA_PHONE))
    expect(mocks.contactsProps.isDeletingPhone(11, FIRST_PHONE)).toBe(false)
    expect(mocks.contactsProps.isDeletingPhone(11, SECOND_PHONE)).toBe(false)
    expect(listCalls).toBe(3)
})

it('keeps an already absent phone deletion idempotent', async () => {
    await renderDetail()
    serverContact.phoneNumbers = phones(SECOND_PHONE)

    await act(async () => {
        mocks.contactsProps.onDeletePhone(11, FIRST_PHONE)
        await waitForNotifications(1)
    })

    expect(api.patch).not.toHaveBeenCalled()
    expect(mocks.showSnackbar).toHaveBeenCalledExactlyOnceWith('Телефон удалён', 'success')
    expect(mocks.contactsProps.isDeletingPhone(11, FIRST_PHONE)).toBe(false)
})

it('preserves contact-delete errors and clears its busy state', async () => {
    await renderDetail()
    api.delete.mockRejectedValueOnce(apiError('Контакт занят'))
    await act(async () => mocks.contactsProps.onDelete(11))
    expect(mocks.confirmProps.open).toBe(true)

    await act(async () => mocks.confirmProps.onConfirm())

    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/api/contacts/11/')
    expect(mocks.showSnackbar).toHaveBeenCalledExactlyOnceWith('Контакт занят', 'error')
    expect(mocks.contactsProps.isDeletingContact(11)).toBe(false)
    expect(mocks.confirmProps.open).toBe(false)
})
