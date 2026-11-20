import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import WarehouseFormPage from './WarehouseForm.jsx'
import { useCreateWarehouse, useGetWarehouse, useUpdateWarehouse } from './utils/stocks.queries.js'

vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('./utils/stocks.queries.js', () => ({
    useGetWarehouse: vi.fn(),
    useCreateWarehouse: vi.fn(),
    useUpdateWarehouse: vi.fn(),
}))

const WAREHOUSE = { id: 7, name: 'Saved warehouse', organization: 'Organization', directions: null }
const CREATE_HINT = 'Сначала сохраните склад, чтобы загрузить схему проезда.'

let container
let root
let query
let createMutation
let updateMutation

function LocationProbe() {
    return <output data-testid="current-path">{useLocation().pathname}</output>
}

const renderAt = async (path) => {
    await act(async () => {
        root.render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/warehouses/create" element={<WarehouseFormPage />} />
                    <Route path="/warehouses/:id/edit" element={<WarehouseFormPage />} />
                    <Route path="/warehouses/:id/map" element={<div>Map upload page</div>} />
                    <Route path="/warehouses" element={<div>Warehouse list</div>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>,
        )
    })
}

const mapAction = (icon = 'AddIcon') => container.querySelector(`[data-testid="${icon}"]`)?.closest('button') ?? null
const currentPath = () => container.querySelector('[data-testid="current-path"]').textContent
const expectNoMapActions = () => {
    expect(mapAction()).toBeNull()
    expect(mapAction('EditIcon')).toBeNull()
    expect(mapAction('VisibilityOutlinedIcon')).toBeNull()
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    query = { data: undefined, isPending: false, error: null }
    createMutation = { isPending: false, mutateAsync: vi.fn() }
    updateMutation = { isPending: false, mutateAsync: vi.fn() }
    vi.mocked(useGetWarehouse).mockImplementation(() => query)
    vi.mocked(useCreateWarehouse).mockImplementation(() => createMutation)
    vi.mocked(useUpdateWarehouse).mockImplementation(() => updateMutation)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.clearAllMocks()
    vi.restoreAllMocks()
})

it('keeps creation on the form without a map action or navigation to an undefined warehouse', async () => {
    query.isPending = true
    await renderAt('/warehouses/create')
    const action = mapAction()
    if (action) await act(async () => action.click())

    expect(currentPath()).toBe('/warehouses/create')
    expectNoMapActions()
    expect(container.textContent).toContain(CREATE_HINT)
})

it('does not expose stale warehouse map actions while warehouse creation is pending', async () => {
    query.data = { ...WAREHOUSE, directions: '/media/warehouse-map.png' }
    createMutation.isPending = true

    await renderAt('/warehouses/create')

    expectNoMapActions()
    expect(currentPath()).toBe('/warehouses/create')
    expect(container.textContent).toContain(CREATE_HINT)
    expect(container.querySelector('button[type="submit"]').disabled).toBe(true)
})

it('opens the loaded warehouse map upload page when adding its first map', async () => {
    query.data = WAREHOUSE
    await renderAt('/warehouses/7/edit')
    const action = mapAction()
    expect(action).not.toBeNull()

    await act(async () => action.click())

    expect(currentPath()).toBe('/warehouses/7/map')
    expect(container.textContent).toContain('Map upload page')
})

it('opens the same warehouse map upload page when editing an existing map', async () => {
    query.data = { ...WAREHOUSE, directions: '/media/warehouse-map.png' }
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await renderAt('/warehouses/7/edit')
    const action = mapAction('EditIcon')
    expect(action).not.toBeNull()

    const view = mapAction('VisibilityOutlinedIcon')
    expect(view).not.toBeNull()
    await act(async () => view.click())
    expect(open).toHaveBeenCalledExactlyOnceWith('/media/warehouse-map.png', '_blank', 'noopener,noreferrer')

    await act(async () => action.click())

    expect(currentPath()).toBe('/warehouses/7/map')
    expect(container.textContent).toContain('Map upload page')
})

it('hides map actions after an edit load failure or when no loaded warehouse matches the route', async () => {
    const unavailableQueries = [
        { data: undefined, isPending: false, error: new Error('Warehouse load failed') },
        { data: { ...WAREHOUSE, id: 9 }, isPending: false, error: null },
        { data: { name: 'Incomplete record' }, isPending: false, error: null },
    ]
    for (const unavailable of unavailableQueries) {
        query = unavailable
        await renderAt('/warehouses/7/edit')

        expectNoMapActions()
        expect(currentPath()).toBe('/warehouses/7/edit')
    }
})
