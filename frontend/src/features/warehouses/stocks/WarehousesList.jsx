import ObjectListView from '../../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../../pages/shared/ObjectListViewCard.jsx'
import { useWarehouses, useDeleteWarehouse } from './stocks.queries.js'

export default function WarehousesList() {
    const { data: warehouses = [], isPending, error, refetch } = useWarehouses()
    const deleteWarehouse = useDeleteWarehouse()

    const handleDelete = async (id) => {
        await deleteWarehouse.mutateAsync(id)
    }

    return (
        <ObjectListView
            title="Склады"
            items={warehouses}
            loading={isPending || deleteWarehouse.isPending}
            error={error}
            onRetry={refetch}
            addTo="/warehouse/create"
            renderRow={(w) => (
                <ObjectListViewCard
                    title={w.name}
                    subtitle={w.organization}
                    extra={w.address}
                    email={w.email}
                    fileUrl={w.directions}
                    to={`/warehouse/${w.id}`}
                    onDelete={() => handleDelete(w.id)}
                />
            )}
        />
    )
}