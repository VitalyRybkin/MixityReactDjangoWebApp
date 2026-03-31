import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import ObjectListView from '../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteClient, useGetClients } from './clients.queries.js'

export default function ClientsList() {
    const { data: clients = [], isPending, error, refetch } = useGetClients()
    const deleteClient = useDeleteClient()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({
        askConfirm,
        showSnackbar,
    })

    const deleteClientMutation = useDeleteClient()

    const handleDeleteClient = (client) => {
        confirmDelete({
            item: client,
            mutateAsync: deleteClientMutation.mutateAsync,
            refetch,
            title: 'Удалить клиента?',
            text: (item) => `Вы действительно хотите удалить "${item.name}"?`,
            successMessage: 'Клиент удален!',
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
                        onDelete={() => handleDeleteClient(c)}
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
