import { act, StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handlePriceChange } from '../utils/handlePriceChange.js'

import { useEditablePrices } from './useEditablePrices.js'
import { useOrderProducts } from './useOrderProducts.js'

const SALE = 'price_at_sale'
const PURCHASE = 'price_at_purchase'
const PRODUCTS = [{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }]
const EMPTY_PRICES = []
const reference = (productId, value) => ({
    product: PRODUCTS.find((product) => product.id === productId),
    sale_price: value,
    purchase_price: value,
})
const savedRow = (overrides = {}) => ({
    id: 10,
    productId: 1,
    quantity: '2',
    price_at_sale: 80,
    price_at_purchase: 40,
    ...overrides,
})
const deferred = () => {
    let resolve
    const promise = new Promise((resolvePromise) => { resolve = resolvePromise })
    return { promise, resolve }
}

let root
let container
let current
let props
let notify
let snapshots
let client
let saleRequests

function Harness({
    customerId,
    warehouseId,
    sales,
    purchases,
    salesReady,
    purchasesReady,
    isEdit,
    isHydrated,
    onReferencePricesChange,
}) {
    const productState = useOrderProducts(PRODUCTS)
    const [salePrices, setSalePrices] = useState([])
    const [purchasePrices, setPurchasePrices] = useState([])
    const productIdsKey = productState.orderProducts.map((row) => row.productId).join(',')
    const shared = {
        isEdit,
        isHydrated,
        products: PRODUCTS,
        orderProducts: productState.orderProducts,
        productIdsKey,
        setOrderProducts: productState.setOrderProducts,
        onReferencePricesChange,
    }

    useEditablePrices({
        ...shared,
        objectId: customerId,
        prices: sales,
        pricesReady: salesReady,
        priceSourceField: 'sale_price',
        orderProductPriceField: SALE,
        setEditablePrices: setSalePrices,
    })
    useEditablePrices({
        ...shared,
        objectId: warehouseId,
        prices: purchases,
        pricesReady: purchasesReady,
        priceSourceField: 'purchase_price',
        orderProductPriceField: PURCHASE,
        setEditablePrices: setPurchasePrices,
    })

    current = {
        ...productState,
        salePrices,
        purchasePrices,
        changePrice: (field, value, rowId = 10) => {
            const row = productState.orderProducts.find((item) => item.id === rowId)
            handlePriceChange({
                id: row.productId,
                value,
                editablePrices: field === SALE ? salePrices : purchasePrices,
                setEditablePrices: field === SALE ? setSalePrices : setPurchasePrices,
                setOrderProducts: productState.setOrderProducts,
                priceType: field,
            })
        },
    }
    return <output>{JSON.stringify(productState.orderProducts)}</output>
}

function QueryHarness({ querySales, ...options }) {
    const saleQuery = useQuery({
        queryKey: ['notification-sale-reference', options.customerId],
        queryFn: () => saleRequests.get(options.customerId).promise,
        enabled: querySales,
        retry: false,
    })
    return <Harness
        {...options}
        sales={querySales ? saleQuery.data ?? EMPTY_PRICES : options.sales}
        salesReady={querySales ? saleQuery.isSuccess && !saleQuery.isFetching : options.salesReady}
    />
}

const render = async (updates = {}) => {
    props = { ...props, ...updates }
    await act(async () => root.render(
        <StrictMode>
            <QueryClientProvider client={client}>
                <QueryHarness {...props} />
            </QueryClientProvider>
        </StrictMode>,
    ))
}
const setRows = async (rows) => {
    await act(async () => current.setOrderProducts(rows))
}
const start = async (updates = {}, rows = [savedRow()]) => {
    await render(updates)
    await setRows(rows)
}
const editPrice = async (field, value, rowId) => {
    await act(async () => current.changePrice(field, value, rowId))
}
const price = (field, rowId = 10) => current.orderProducts.find((row) => row.id === rowId)?.[field]
const expectOnlySaleNotice = (missing = false) => {
    expect(notify).toHaveBeenCalledExactlyOnceWith({ field: SALE, missing })
}
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

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    saleRequests = new Map()
    snapshots = []
    notify = vi.fn((notification) => {
        snapshots.push({ notification, rows: JSON.parse(container.querySelector('output').textContent) })
    })
    props = {
        customerId: 1,
        warehouseId: 1,
        sales: [reference(1, 100), reference(2, 200)],
        purchases: [reference(1, 50), reference(2, 150)],
        salesReady: true,
        purchasesReady: true,
        isEdit: true,
        isHydrated: true,
        querySales: false,
        onReferencePricesChange: notify,
    }
})

afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
})

describe('reference-price notifications in an existing order', () => {
    it('preserves saved prices without warning through delayed edit-form hydration', async () => {
        await start({ customerId: null, warehouseId: null, isHydrated: false, salesReady: false, purchasesReady: false })

        await render({ customerId: 7, warehouseId: 8, isHydrated: true, salesReady: true, purchasesReady: true })

        expect(price(SALE)).toBe(80)
        expect(price(PURCHASE)).toBe(40)
        expect(notify).not.toHaveBeenCalled()
    })

    it.each([
        ['a manual price', 125],
        ['an explicit zero', 0],
        ['a deliberately cleared price', null],
    ])('replaces %s from the previous customer and notifies after the update commits', async (_label, manualPrice) => {
        await start()
        await editPrice(SALE, manualPrice)
        expect(notify).not.toHaveBeenCalled()

        await render({ customerId: 2, sales: [reference(1, 250)] })

        expect(price(SALE)).toBe(250)
        expect(price(PURCHASE)).toBe(40)
        expectOnlySaleNotice()
        expect(snapshots[0].rows[0][SALE]).toBe(250)
        expect(current.orderProducts[0][`${SALE}_cleared`]).toBe(false)
    })

    it('keeps customer sale prices and warehouse purchase prices independent', async () => {
        await start()
        await editPrice(PURCHASE, 45)

        await render({ customerId: 2, sales: [reference(1, 220)] })

        expect(price(SALE)).toBe(220)
        expect(price(PURCHASE)).toBe(45)
        expectOnlySaleNotice()

        await render({ warehouseId: 3, purchases: [reference(1, 90)] })

        expect(price(SALE)).toBe(220)
        expect(price(PURCHASE)).toBe(90)
        expect(notify.mock.calls.map(([notice]) => notice)).toEqual([
            { field: SALE, missing: false },
            { field: PURCHASE, missing: false },
        ])
        expect(snapshots[1].rows[0][PURCHASE]).toBe(90)
    })

    it('waits for the current query and emits only once despite StrictMode and reference rerenders', async () => {
        await start()
        await render({ customerId: 2, sales: [reference(1, 999)], salesReady: false })
        expect(notify).not.toHaveBeenCalled()

        await render({ sales: [reference(1, 200)], salesReady: true })
        expect(price(SALE)).toBe(200)
        expectOnlySaleNotice()

        await render({ sales: [reference(1, 200)] })
        await act(async () => current.handleChange(10, { quantity: '3' }))

        expectOnlySaleNotice()
    })

    it('distinguishes missing references from an explicit zero quote', async () => {
        await start()

        await render({ customerId: 2, sales: [] })

        expect(price(SALE)).toBeNull()
        expectOnlySaleNotice(true)
        expect(snapshots[0].rows[0][SALE]).toBeNull()

        await render({ customerId: 3, sales: [reference(1, '0.00')] })

        expect(price(SALE)).toBe(0)
        expect(notify.mock.calls[1][0]).toEqual({ field: SALE, missing: false })
    })

    it('emits one notification for multiple changed rows and reports any missing reference', async () => {
        await start({}, [savedRow(), savedRow({ id: 20, productId: 2, price_at_sale: 160 })])

        await render({ customerId: 2, sales: [reference(1, 300)] })

        expect(price(SALE, 10)).toBe(300)
        expect(price(SALE, 20)).toBeNull()
        expectOnlySaleNotice(true)
        expect(snapshots[0].rows.map((row) => row[SALE])).toEqual([300, null])
    })

    it('preserves a manual entry equal to the cached quote when a newer quote arrives', async () => {
        await start()
        await render({ customerId: 2, sales: [reference(1, 200)] })
        expect(price(SALE)).toBe(200)
        expectOnlySaleNotice()

        await editPrice(SALE, 200)
        await render({ sales: [reference(1, 275)] })

        expect(price(SALE)).toBe(200)
        expectOnlySaleNotice()
    })

    it.each([
        ['zero', 0],
        ['a clear', null],
    ])('preserves %s entered after an entity change while its quote is pending', async (_label, manualPrice) => {
        await start()
        await render({ customerId: 2, sales: [], salesReady: false })

        await editPrice(SALE, manualPrice)
        await render({ sales: [reference(1, 250)], salesReady: true })

        expect(price(SALE)).toBe(manualPrice)
        expect(notify).not.toHaveBeenCalled()
    })

    it('ignores a late previous-customer response after a newer customer has settled', async () => {
        saleRequests.set(1, deferred())
        saleRequests.set(2, deferred())
        saleRequests.set(3, deferred())
        await start({ querySales: true })
        await act(async () => saleRequests.get(1).resolve([reference(1, 100)]))
        await eventually(() => expect(client.getQueryData(['notification-sale-reference', 1])).toBeDefined())

        await render({ customerId: 2 })
        await render({ customerId: 3 })
        await act(async () => saleRequests.get(3).resolve([reference(1, 300)]))
        await eventually(() => {
            expect(price(SALE)).toBe(300)
            expectOnlySaleNotice()
        })

        await act(async () => saleRequests.get(2).resolve([reference(1, 200)]))
        await eventually(() => expect(client.getQueryData(['notification-sale-reference', 2])).toBeDefined())

        expect(price(SALE)).toBe(300)
        expectOnlySaleNotice()
    })

    it('does not warn for equal settled values or an entity change without existing product rows', async () => {
        await start()
        await render({ customerId: 2, sales: [], salesReady: false })
        await render({ sales: [reference(1, 80)], salesReady: true })
        expect(price(SALE)).toBe(80)
        expect(notify).not.toHaveBeenCalled()

        await setRows([])
        await render({ customerId: 3, sales: [reference(1, 900)] })

        expect(notify).not.toHaveBeenCalled()
    })

    it('updates a replaced product without treating product or manual edits as an entity-change warning', async () => {
        await start()
        await act(async () => current.handleChange(10, { productId: 2 }))

        expect(price(SALE)).toBe(200)
        expect(price(PURCHASE)).toBe(150)
        await editPrice(SALE, 210)
        await editPrice(PURCHASE, 0)
        await render({ sales: [reference(2, 240)], purchases: [reference(2, 170)] })

        expect(price(SALE)).toBe(210)
        expect(price(PURCHASE)).toBe(0)
        expect(notify).not.toHaveBeenCalled()
    })

    it('fills new-order references without emitting edit-order notifications', async () => {
        await start({ isEdit: false }, [savedRow({ id: 'new-row', price_at_sale: null, price_at_purchase: null })])
        expect(price(SALE, 'new-row')).toBe(100)

        await render({ customerId: 2, sales: [reference(1, 300)] })

        expect(price(SALE, 'new-row')).toBe(300)
        expect(notify).not.toHaveBeenCalled()
    })
})
