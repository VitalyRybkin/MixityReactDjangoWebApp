import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import OrderFormPage from './OrderForm.jsx'

vi.mock('../../components/AppBreadcrumbs.jsx', () => ({ default: () => null }))
vi.mock('../../components/PageHeaderCreateUpdate.jsx', () => ({ default: () => null }))
vi.mock('./components/OrderMainFields.jsx', () => ({ default: () => null }))
vi.mock('./components/OrderCustomerFields.jsx', () => ({ default: () => null }))
vi.mock('./components/OrderProductsList.jsx', () => ({ default: () => null }))
vi.mock('./hooks/useUnsavedGuard.js', () => ({
    useUnsavedGuard: () => ({ confirmOpen: false }),
}))
vi.mock('./hooks/useOrderFormData.js', () => ({
    useOrderFormData: () => ({ isDirty: false, isInitialized: true, markClean: () => {} }),
}))
vi.mock('./hooks/useViewUpd.js', () => ({ useViewUpd: () => () => {} }))
vi.mock('./utils/orders.queries.js', () => {
    const mutation = { isPending: false, mutateAsync: vi.fn() }
    const resources = { products: [], customers: [], warehouses: [], pack_types: [] }
    return {
        useGetOrderResources: () => ({ data: resources, isPending: false }),
        useGetOrder: () => ({ data: { id: 42 }, isPending: false }),
        useCreateOrder: () => mutation,
        useUpdateOrder: () => mutation,
        useUploadUpd: () => mutation,
    }
})
vi.mock('../customers/utils/customers.queries.js', () => ({
    useGetCustomerPrices: () => ({ data: [], isSuccess: true, isLoading: false, isFetching: false }),
}))
vi.mock('../warehouses/utils/stocks.queries.js', () => ({
    useGetWarehousePrices: () => ({ data: [], isSuccess: true, isLoading: false, isFetching: false }),
}))
vi.mock('./components/OrderDetailSideBar.jsx', () => ({
    default: ({ onReferencePricesChange }) => (
        <div>
            {[
                ['sale-updated', 'price_at_sale', false],
                ['sale-missing', 'price_at_sale', true],
                ['purchase-updated', 'price_at_purchase', false],
                ['purchase-missing', 'price_at_purchase', true],
            ].map(([name, field, missing]) => (
                <button
                    key={name}
                    type="button"
                    data-testid={name}
                    onClick={() => onReferencePricesChange({ field, missing })}
                >
                    {name}
                </button>
            ))}
        </div>
    ),
}))

let container
let root

const renderForm = async ({ readOnly = false, create = false } = {}) => {
    await act(async () => root.render(
        <MemoryRouter initialEntries={[create ? '/orders/create' : '/orders/42/edit']}>
            <Routes>
                <Route path="/orders/create" element={<OrderFormPage readOnly={readOnly} />} />
                <Route path="/orders/:id/edit" element={<OrderFormPage readOnly={readOnly} />} />
            </Routes>
        </MemoryRouter>,
    ))
}

const notifyFromSidebar = async (name) => {
    const button = container.querySelector(`[data-testid="${name}"]`)
    expect(button).not.toBeNull()
    await act(async () => button.click())
}

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

it.each([
    ['sale-updated', 'Цена заказчика обновлена по справочнику.'],
    ['sale-missing', 'Для нового заказчика не найдена справочная цена. Укажите цену вручную.'],
    ['purchase-updated', 'Цена склада обновлена по справочнику.'],
    ['purchase-missing', 'Для нового склада не найдена справочная цена. Укажите цену вручную.'],
])('shows the %s notification through the existing warning snackbar', async (name, message) => {
    await renderForm()
    expect(document.querySelectorAll('.MuiSnackbar-root')).toHaveLength(0)

    await notifyFromSidebar(name)

    expect(document.querySelectorAll('.MuiSnackbar-root')).toHaveLength(1)
    const alerts = document.querySelectorAll('[role="alert"]')
    expect(alerts).toHaveLength(1)
    expect(alerts[0].querySelector('.MuiAlert-message').textContent).toBe(message)
    expect(alerts[0].classList.contains('MuiAlert-filledWarning')).toBe(true)
})

it.each([
    ['read-only orders', { readOnly: true }],
    ['new orders', { create: true }],
])('suppresses sidebar price notifications for %s', async (_description, options) => {
    await renderForm(options)

    for (const name of ['sale-updated', 'sale-missing', 'purchase-updated', 'purchase-missing']) {
        await notifyFromSidebar(name)
    }

    expect(document.querySelectorAll('.MuiSnackbar-root')).toHaveLength(0)
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(0)
})
