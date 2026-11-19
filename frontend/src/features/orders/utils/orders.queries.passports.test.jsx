import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'

import api from '../../../api.js'

import { useUpdateOrder } from './orders.queries.js'
import { fetchQualityPassportState, qualityPassportKeys } from './qualityPassports.queries.js'

vi.mock('../../../api.js', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))

it.each([false, true])(
    'refreshes other products and Catalog after an order passport save (conflict: %s)',
    async (conflict) => {
        const client = new QueryClient()
        const container = document.createElement('div')
        const root = createRoot(container)
        const onPassportConflict = vi.fn()
        const queries = [
            { productId: 1, orderId: 10 },
            { productId: 2, source: 'catalog' },
        ].map((params) => ({
            queryKey: qualityPassportKeys.state(params),
            queryFn: () => fetchQualityPassportState(params),
            staleTime: Infinity,
        }))
        const unrelatedKey = ['unrelated']
        let mutateAsync

        function UpdateOrder() {
            const mutation = useUpdateOrder({ onPassportConflict })
            mutateAsync = mutation.mutateAsync
            return null
        }

        for (const { queryKey } of queries) {
            client.setQueryData(queryKey, { suggested_next_passport_number: 545 })
        }
        client.setQueryData(unrelatedKey, 'cached')
        vi.mocked(api.get).mockResolvedValue({ data: { suggested_next_passport_number: 546 } })
        const error = { response: { status: 409, data: { errors: { code: 'passport_number_conflict' } } } }
        if (conflict) vi.mocked(api.patch).mockRejectedValueOnce(error)
        else vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 10 } })

        try {
            await act(async () =>
                root.render(
                    <QueryClientProvider client={client}>
                        <UpdateOrder />
                    </QueryClientProvider>,
                ),
            )
            await act(async () => {
                const save = mutateAsync({ id: 10, payload: {} })
                if (conflict) await expect(save).rejects.toBe(error)
                else await save
            })
            if (conflict) expect(onPassportConflict).toHaveBeenCalledWith(error)
            else expect(onPassportConflict).not.toHaveBeenCalled()
            expect(client.getQueryState(unrelatedKey).isInvalidated).toBe(false)
            for (const query of queries) {
                expect(client.getQueryState(query.queryKey).isInvalidated).toBe(true)
                expect(await client.fetchQuery(query)).toEqual({ suggested_next_passport_number: 546 })
            }
        } finally {
            await act(async () => root.unmount())
            client.clear()
        }
    },
)
