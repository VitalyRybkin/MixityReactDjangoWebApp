import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete.js'
import useSnackbar from '../../../hooks/useSnackbar.js'
import ObjectListView from '../../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteCarrier, useGetCarriers } from './carriers.queries.js'

export default function CarriersList() {
    const { data: carriers = [], isPending, error, refetch } = useGetCarriers()
    const deleteCarrier = useDeleteCarrier()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({ askConfirm, showSnackbar })

    const deleteCarrierMutation = useDeleteCarrier()

    const handleDeleteCarrier = (carrier) => {
        confirmDelete({
            item: carrier,
            mutateAsync: deleteCarrierMutation.mutateAsync,
            refetch,
            title: 'Удалить перевозчика?',
            text: (item) => `Вы действительно хотите удалить "${item.name}"?`,
            successMessage: 'Перевозчик удален!',
        })
    }

    return (
        <>
            <ObjectListView
                title="Грузоперевозчики"
                items={carriers}
                loading={isPending || deleteCarrier.isPending}
                error={error}
                onRetry={refetch}
                addTo="/carriers/create"
                renderRow={(c) => (
                    <ObjectListViewCard
                        key={c.id}
                        title={c.name}
                        subtitle={c.organization}
                        address={c.address}
                        email={c.email}
                        phone={c.phone}
                        to={`/carriers/${c.id}`}
                        onDelete={() => handleDeleteCarrier(c)}
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
