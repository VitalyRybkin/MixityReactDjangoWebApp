import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RepairRequestFormPage from './RepairRequestForm.jsx'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => ({
    ...await importOriginal(),
    useNavigate: () => navigate,
}))
vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('../../components/PageHeaderCreateUpdate.jsx', () => ({
    default: ({ saving, saveDisabled }) => <button type="submit" disabled={saving || saveDisabled}>Save</button>,
}))
vi.mock('../orders/hooks/useUnsavedGuard.js', () => ({
    useUnsavedGuard: () => ({ confirmOpen: false }),
}))
vi.mock('./components/RepairFilesSection.jsx', () => ({ default: () => null }))
vi.mock('./components/RepairRequestExecutionFields.jsx', () => ({ default: () => null }))
vi.mock('./components/RepairSpecificationPartsList.jsx', () => ({ default: () => null }))
vi.mock('./components/RepairSpecificationServicesList.jsx', () => ({ default: () => null }))
vi.mock('./components/RepairRequestDescription.jsx', () => ({
    default: ({ form, onChange }) => {
        currentForm = form
        changeDescription = (value) => onChange('description')({ target: { value } })
        return null
    },
}))
vi.mock('./utils/repair.queries.js', () => ({
    useGetRepairRequest: (_id, { enabled }) => ({ data: enabled ? request : undefined, isPending: false }),
    useGetRepairCompanies: () => ({ data: companies }),
    useCreateRepairRequest: () => ({ mutateAsync: createRequest, isPending: false }),
    useUpdateRepairRequest: () => ({ mutateAsync: updateRequest, isPending: false }),
}))
vi.mock('../customers/utils/customers.queries.js', () => ({
    useGetCustomers: () => ({ data: customers }),
    useGetCustomerObjects: (customerId) => ({ data: customerId ? objects : [] }),
}))
vi.mock('./utils/repair.parts.queries.js', () => ({ useGetSpareParts: () => ({ data: [] }) }))
vi.mock('./utils/repair.services.queries.js', () => ({ useGetRepairServices: () => ({ data: [] }) }))
vi.mock('./utils/repair.files.queries.js', () => {
    const mutation = { isPending: false }
    return {
        useGetRepairFiles: () => ({ data: { request_files: [], closing_files: [] }, isLoading: false }),
        useUploadRequestFile: () => mutation,
        useDeleteRequestFile: () => mutation,
        useUploadClosingFile: () => mutation,
        useDeleteClosingFile: () => mutation,
    }
})

const CUSTOMER = { id: 3, name: 'Saved customer' }
const ACTIVE_COMPANY = { id: 8, name: 'Active repair company' }
const ACTIVE_OBJECT = { id: 10, name: 'Active construction object', customer: 3 }
const ARCHIVED_OBJECT = {
    id: 9,
    name: 'Archived construction object',
    address: 'Historical object address',
    customer: 3,
    customer_name: CUSTOMER.name,
}
const COMPANY_LABEL = 'Ремонтирующая компания № 7'
let container
let root
let request
let companies
let customers
let objects
let createRequest
let updateRequest
let currentForm
let changeDescription

const renderForm = async ({ create = false } = {}) => {
    await act(async () => root.render(
        <MemoryRouter initialEntries={[create ? '/repair/requests/create' : '/repair/requests/42']}>
            <Routes>
                <Route path="/repair/requests/create" element={<RepairRequestFormPage />} />
                <Route path="/repair/requests/:id" element={<RepairRequestFormPage />} />
            </Routes>
        </MemoryRouter>,
    ))
}
const input = (name) => {
    const label = { company: 'Ремонтирующая компания', customer: 'Контрагент', object: 'Объект' }[name]
    const autocomplete = [...container.querySelectorAll('.MuiAutocomplete-root')]
        .find((element) => element.querySelector('label')?.textContent === label)
    return autocomplete?.querySelector('input[role="combobox"]') ?? null
}
const openSelect = async (name) => {
    const field = input(name)
    expect(field).not.toBeNull()
    await act(async () => {
        field.focus()
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    return [...document.querySelectorAll('[role="option"]')]
}
const select = async (name, label) => {
    const option = (await openSelect(name)).find((element) => element.textContent === label)
    expect(option).toBeDefined()
    await act(async () => option.click())
}
const clear = async (name) => {
    const button = input(name).closest('.MuiAutocomplete-root').querySelector('button[aria-label="Clear"]')
    expect(button).not.toBeNull()
    await act(async () => button.click())
}
const editDescription = async (value = 'Description-only change') => {
    await act(async () => changeDescription(value))
}
const submit = async () => {
    const button = [...container.querySelectorAll('button')].find((element) => element.textContent === 'Save')
    expect(button.disabled).toBe(false)
    await act(async () => button.click())
}
const updatePayload = () => {
    expect(updateRequest).toHaveBeenCalledTimes(1)
    expect(updateRequest.mock.calls[0][0].id).toBe('42')
    expect(navigate).toHaveBeenCalledWith('/repair/requests')
    return updateRequest.mock.calls[0][0].payload
}

beforeEach(() => {
    navigate.mockReset()
    updateRequest = vi.fn().mockResolvedValue({ id: 42 })
    createRequest = vi.fn().mockResolvedValue({ id: 43 })
    request = {
        id: 42,
        request_date: '2026-11-17',
        closing_date: null,
        status: 'open',
        location: 'site',
        repair_company: 7,
        construction_object: { ...ARCHIVED_OBJECT },
        description: 'Original description',
        inspection_description: '',
        closing_description: '',
        specifications: [],
    }
    companies = [ACTIVE_COMPANY]
    customers = [CUSTOMER]
    objects = [ACTIVE_OBJECT]
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 36, width: 200, height: 36,
        toJSON: () => ({}),
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
})

describe('repair edits with historical company and object relations', () => {
    it('shows saved historical labels alongside active choices, including a missing customer', async () => {
        customers = []
        await renderForm()

        expect(input('company').value).toBe(COMPANY_LABEL)
        expect(input('object').value).toBe(ARCHIVED_OBJECT.name)
        expect(input('customer').value).toBe(CUSTOMER.name)
        expect((await openSelect('company')).map((option) => option.textContent).sort())
            .toEqual([COMPANY_LABEL, ACTIVE_COMPANY.name].sort())
    })

    it('saves a description-only edit without resending the archived company or object', async () => {
        await renderForm()
        await editDescription()
        await submit()

        const payload = updatePayload()
        expect(payload.description).toBe('Description-only change')
        expect(payload).not.toHaveProperty('repair_company')
        expect(payload).not.toHaveProperty('construction_object')
        expect(request.repair_company).toBe(7)
        expect(request.construction_object).toEqual(ARCHIVED_OBJECT)
    })

    it('includes an explicitly selected active company and omits the unchanged object', async () => {
        await renderForm()
        await select('company', ACTIVE_COMPANY.name)
        await submit()

        const payload = updatePayload()
        expect(payload.repair_company).toBe(8)
        expect(payload).not.toHaveProperty('construction_object')
    })

    it('includes an explicitly selected active object and omits the unchanged company', async () => {
        await renderForm()
        await select('object', ACTIVE_OBJECT.name)
        await submit()

        const payload = updatePayload()
        expect(payload.construction_object).toBe(10)
        expect(payload).not.toHaveProperty('repair_company')
    })

    it('sends an explicit company clear instead of restoring the archived company', async () => {
        await renderForm()
        await clear('company')
        await submit()

        const payload = updatePayload()
        expect(payload).toHaveProperty('repair_company')
        expect([null, '']).toContain(payload.repair_company)
        expect(payload).not.toHaveProperty('construction_object')
    })

    it('sends an explicit object clear instead of restoring the archived object', async () => {
        await renderForm()
        await clear('object')
        await submit()

        const payload = updatePayload()
        expect(payload).toHaveProperty('construction_object')
        expect([null, '']).toContain(payload.construction_object)
        expect(payload).not.toHaveProperty('repair_company')
    })

    it('includes selected company and object IDs when creating a new repair request', async () => {
        await renderForm({ create: true })
        await select('company', ACTIVE_COMPANY.name)
        await select('customer', CUSTOMER.name)
        await select('object', ACTIVE_OBJECT.name)
        await submit()

        expect(updateRequest).not.toHaveBeenCalled()
        expect(createRequest).toHaveBeenCalledTimes(1)
        expect(createRequest.mock.calls[0][0]).toMatchObject({ repair_company: 8, construction_object: 10 })
        expect(navigate).toHaveBeenCalledWith('/repair/requests')
    })

    it('preserves explicit choices and the unsaved draft through resource and request refreshes', async () => {
        await renderForm()
        await select('company', ACTIVE_COMPANY.name)
        await select('object', ACTIVE_OBJECT.name)
        await editDescription('Unsaved description')
        companies = [{ ...ACTIVE_COMPANY, name: 'Refreshed company label' }]
        objects = [{ ...ACTIVE_OBJECT, name: 'Refreshed object label' }]
        request = { ...request, description: 'Background server description' }

        await renderForm()

        expect(currentForm.description).toBe('Unsaved description')
        expect(currentForm.repair_company).toBe(8)
        expect(currentForm.construction_object).toBe(10)
        expect(input('company').value).toBe('Refreshed company label')
        expect(input('object').value).toBe('Refreshed object label')
        await submit()
        expect(updatePayload()).toMatchObject({
            description: 'Unsaved description',
            repair_company: 8,
            construction_object: 10,
        })
    })
})
