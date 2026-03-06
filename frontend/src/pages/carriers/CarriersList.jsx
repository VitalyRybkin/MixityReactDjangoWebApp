import api from '../../api.js'
import { useListResource } from '../../hooks/useListResource.js'
import ObjectListView from '../shared/ObjectListView.jsx'
import ObjectListViewCard from '../shared/ObjectListViewCard.jsx'

export default function CarriersList() {
    const { items: carriers, loading, error, reload } = useListResource(() => api.get('/api/logistic/carriers/'), [])

    const handleDelete = async (id) => {
        await api.delete(`/api/logistic/carriers/${id}/`)
        await reload()
    }

    return (
        <ObjectListView
            title="Грузоперевозчики"
            items={carriers}
            loading={loading}
            error={error}
            onRetry={reload}
            addTo={`/carrier/create`}
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
