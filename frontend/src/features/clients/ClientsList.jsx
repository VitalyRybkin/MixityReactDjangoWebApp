import ObjectListView from '../../components/ObjectListView.jsx'
import ObjectListViewRow from '../../components/ObjectListViewRow.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import useSnackbar from '../../hooks/useSnackbar.js'

import { useDeleteClient, useGetClients } from './utils/clients.queries.js'

export default function ClientsList() {
    const { data: clients = [], isPending, error, refetch } = useGetClients()
    const deleteClient = useDeleteClient()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({
        askConfirm,
        showSnackbar,
    })

    const handleDeleteClient = (client) => {
        confirmDelete({
            item: client,
            mutateAsync: deleteClient.mutateAsync,
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
                renderRow={(client) => (
                    <ObjectListViewRow
                        title={client.name}
                        subtitle={client.organization}
                        address={client.address}
                        email={client.email}
                        phone={client.phone}
                        to={`/clients/${client.id}`}
                        onDelete={() => handleDeleteClient(client)}
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
