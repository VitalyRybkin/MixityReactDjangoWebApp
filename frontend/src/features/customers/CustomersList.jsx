import ObjectListView from '../../components/ObjectListView.jsx'
import ObjectListViewCard from '../../components/ObjectListViewCard.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import useSnackbar from '../../hooks/useSnackbar.js'

import { useDeleteCustomer, useGetCustomers } from './utils/customers.queries.js'

export default function CustomersList() {
    const { data: customers = [], isPending, error, refetch } = useGetCustomers()
    const deleteCustomer = useDeleteCustomer()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({
        askConfirm,
        showSnackbar,
    })

    const deleteCustomerMutation = useDeleteCustomer()

    const handleDeleteCustomer = (customer) => {
        confirmDelete({
            item: customer,
            mutateAsync: deleteCustomerMutation.mutateAsync,
            refetch,
            title: 'Удалить заказчика?',
            text: (item) => `Вы действительно хотите удалить "${item.name}"?`,
            successMessage: 'Заказчик удален!',
        })
    }

    return (
        <>
            <ObjectListView
                title="Заказчики"
                items={customers}
                loading={isPending || deleteCustomer.isPending}
                error={error}
                onRetry={refetch}
                addTo="/customers/create"
                renderRow={(c) => (
                    <ObjectListViewCard
                        key={c.id}
                        title={c.name}
                        subtitle={c.organization}
                        address={c.address}
                        email={c.email}
                        phone={c.phone}
                        to={`/customers/${c.id}`}
                        onDelete={() => handleDeleteCustomer(c)}
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
