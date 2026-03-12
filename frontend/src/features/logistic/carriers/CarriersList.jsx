import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../../hooks/useConfirm.js'
import useSnackbar from '../../../hooks/useSnackbar.js'
import ObjectListView from '../../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteCarrier, useGetCarriers } from './carriers.queries.js'

export default function CarriersList() {
    const { data: carriers = [], isPending, error, refetch } = useGetCarriers()
    const deleteCarrier = useDeleteCarrier()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const handleDelete = (carrier) => {
        askConfirm({
            title: 'Удалить перевозчика?',
            text: `Вы действительно хотите удалить "${carrier.name}"?`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmColor: 'error',
            onConfirm: async () => {
                try {
                    await deleteCarrier.mutateAsync(carrier.id)
                    showSnackbar('Перевозчик удален', 'success')
                    await refetch()
                } catch {
                    showSnackbar('Ошибка удаления!', 'error')
                }
            },
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
                renderRow={(w) => (
                    <ObjectListViewCard
                        key={w.id}
                        title={w.name}
                        subtitle={w.fullName}
                        extra={w.address}
                        email={w.email}
                        phone={w.phone}
                        to={`/carriers/${w.id}`}
                        onDelete={() => handleDelete(w)}
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
