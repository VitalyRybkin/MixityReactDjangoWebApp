import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete.js'
import useSnackbar from '../../../hooks/useSnackbar.js'
import ObjectListView from '../../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteWarehouse, useWarehouses } from './stocks.queries.js'

export default function WarehousesList() {
    const { data: warehouses = [], isPending, error, refetch } = useWarehouses()
    const deleteWarehouse = useDeleteWarehouse()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({
        askConfirm,
        showSnackbar,
    })

    const handleDeleteWarehouse = (warehouse) => {
        confirmDelete({
            item: warehouse,
            mutateAsync: useDeleteWarehouse.mutateAsync,
            refetch,
            title: 'Удалить склад?',
            text: (item) => `Вы действительно хотите удалить "${item.name}"?`,
            successMessage: 'Склад удален!',
        })
    }

    return (
        <>
            <ObjectListView
                title="Склады"
                items={warehouses}
                loading={isPending || deleteWarehouse.isPending}
                error={error}
                onRetry={refetch}
                addTo="/warehouses/create"
                renderRow={(w) => (
                    <ObjectListViewCard
                        title={w.name}
                        subtitle={w.organization}
                        address={w.address}
                        email={w.email}
                        phone={w.phone}
                        fileUrl={w.directions}
                        to={`/warehouses/${w.id}`}
                        onDelete={() => handleDeleteWarehouse(w)}
                    />
                )}
            />
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                text={confirm.text}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                confirmColor={confirm.confirmColor}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </>
    )
}
