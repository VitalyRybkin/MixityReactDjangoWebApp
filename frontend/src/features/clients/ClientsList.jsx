import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import ObjectListView from '../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteClient, useGetClients } from './clients.queries.js'

export default function ClientsList() {
    const { data: clients = [], isPending, error, refetch } = useGetClients()
    const deleteClient = useDeleteClient()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const handleDelete = (client) => {
        askConfirm({
            title: 'Удалить клиента?',
            text: `Вы действительно хотите удалить "${client.name}"?`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmColor: 'error',
            onConfirm: async () => {
                try {
                    await deleteClient.mutateAsync(client.id)
                    showSnackbar('Клиент удален', 'success')
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
                title="Клиенты"
                items={clients}
                loading={isPending || deleteClient.isPending}
                error={error}
                onRetry={refetch}
                addTo="/clients/create"
                renderRow={(c) => (
                    <ObjectListViewCard
                        key={c.id}
                        title={c.name}
                        subtitle={c.organization}
                        address={c.address}
                        email={c.email}
                        phone={c.phone}
                        to={`/clients/${c.id}`}
                        onDelete={() => handleDelete(c)}
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
