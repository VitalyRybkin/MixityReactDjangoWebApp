import { useState } from 'react'

import { useDeleteOrder } from '../../features/orders/utils/orders.queries.js'

export function useDeleteOrderFlow(onSuccess) {
    const [orderToDelete, setOrderToDelete] = useState(null)
    const deleteOrder = useDeleteOrder()

    const handleConfirmDelete = () => {
        if (!orderToDelete) return

        deleteOrder.mutate(orderToDelete.id, {
            onSuccess: () => {
                setOrderToDelete(null)
                onSuccess?.()
            },
        })
    }

    return {
        orderToDelete,
        setOrderToDelete,
        handleConfirmDelete,
        isDeleting: deleteOrder.isPending,
    }
}
