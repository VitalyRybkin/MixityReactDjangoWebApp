import api from '../../api.js'
import ObjectBaseInfoCard from '../../components/ui/ObjectBaseInfoCard.jsx'
import ObjectListView from '../shared/ObjectListView.jsx'
import { useListResource } from '../../hooks/useListResource.js'

export default function WarehousesList() {
    const { items: warehouses, loading } = useListResource(() => api.get('/api/stock/'), [])

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
                />
            )}
        />
    )
}
