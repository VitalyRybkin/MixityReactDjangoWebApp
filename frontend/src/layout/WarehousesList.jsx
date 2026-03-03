import api from '../api'
import ListInfoCard from '../components/ListInfoCard'
import UniversalListView from '../components/UniversalListView'
import { useListResource } from '../hooks/useListResource'

export default function WarehousesList() {
    const { items: warehouses, loading } = useListResource(() => api.get('/api/stock/'), [])

    return (
        <UniversalListView
            title="Склады"
            items={warehouses}
            loading={loading}
            renderRow={(w) => (
                <ListInfoCard
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
