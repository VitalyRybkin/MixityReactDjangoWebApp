import api from '../api'
import ListInfoCard from '../components/ListInfoCard'
import UniversalListView from '../components/UniversalListView'
import { useListResource } from '../hooks/useListResource'

export default function CarriersList() {
    const { items: carriers, loading } = useListResource(() => api.get('/api/logistic/carriers/'), [])

    return (
        <UniversalListView
            title="Грузоперевозчики"
            items={carriers}
            loading={loading}
            renderRow={(w) => (
                <ListInfoCard
                    title={w.name}
                    subtitle={w.fullName}
                    extra={w.address}
                    email={w.email}
                    to={`/carriers/${w.id}`}
                />
            )}
        />
    )
}
