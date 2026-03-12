import ObjectListView from '../../../pages/shared/ObjectListView.jsx'
import ObjectListViewCard from '../../../pages/shared/ObjectListViewCard.jsx'

import { useDeleteCarrier, useGetCarriers } from './carriers.queries.js'

export default function CarriersList() {
    const { data: carriers = [], isPending, error, refetch } = useGetCarriers()
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
            addTo="/carriers/create"
            renderRow={(w) => (
                <ObjectListViewCard
                    title={w.name}
                    subtitle={w.fullName}
                    extra={w.address}
                    email={w.email}
                    to={`/carriers/${w.id}`}
                    onDelete={() => handleDelete(w.id)}
                />
            )}
        />
    )
}
