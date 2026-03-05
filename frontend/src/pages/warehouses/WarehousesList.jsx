import api from '../../api.js'
import ObjectBaseInfoCard from '../../components/ui/ObjectBaseInfoCard.jsx'
import { useListResource } from '../../hooks/useListResource.js'
import ObjectListView from '../shared/ObjectListView.jsx'

export default function WarehousesList() {
    const { items: warehouses, loading, reload } = useListResource(() => api.get('/api/stock/'), [])

    const handleDelete = async (id) => {
        await api.delete(`/api/logistic/carriers/${id}/`)
        await reload()
    }
    return (
        <ObjectListView
            title="Склады"
            items={warehouses}
            loading={loading}
            renderRow={(w) => (
                <ObjectBaseInfoCard
                    title={w.name}
                    subtitle={w.organization}
                    extra={w.address}
                    email={w.email}
                    fileUrl={w.directions}
                    to={`/warehouses/${w.id}`}
                    onDelete={() => handleDelete(w.id)}
                />
            )}
        />
    )
}
