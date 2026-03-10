import { useCarriers, useDeleteCarrier } from '../../features/logistic/carriers/carrier.queries.js'
import ObjectListView from '../shared/ObjectListView.jsx'
import ObjectListViewCard from '../shared/ObjectListViewCard.jsx'

export default function CarriersList() {
    const { data: carriers = [], isPending, error, refetch } = useCarriers()
    const deleteCarrier = useDeleteCarrier()

    const handleDelete = async (id) => {
        await deleteCarrier.mutateAsync(id)
    }

    return (
        <ObjectListView
            title="Грузоперевозчики"
            items={carriers}
            loading={isPending || deleteCarrier.isPending}
            error={error}
            onRetry={refetch}
            addTo="/carrier/create"
            renderRow={(w) => (
                <ObjectListViewCard
                    title={w.name}
                    subtitle={w.fullName}
                    extra={w.address}
                    email={w.email}
                    to={`/carrier/${w.id}`}
                    onDelete={() => handleDelete(w.id)}
                />
            )}
        />
    )
}