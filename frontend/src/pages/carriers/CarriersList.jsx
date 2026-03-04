import api from '../../api.js'
import ObjectBaseInfoCard from '../../components/ui/ObjectBaseInfoCard.jsx'
import ObjectListView from '../shared/ObjectListView.jsx'
import { useListResource } from '../../hooks/useListResource.js'

export default function CarriersList() {
    const { items: carriers, loading } = useListResource(() => api.get('/api/logistic/carriers/'), [])

    return (
        <ObjectListView
            title="Грузоперевозчики"
            items={carriers}
            loading={loading}
            renderRow={(w) => (
                <ObjectBaseInfoCard
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
