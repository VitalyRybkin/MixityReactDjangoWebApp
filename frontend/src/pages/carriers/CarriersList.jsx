import api from '../../api.js'
import ObjectBaseInfoCard from '../../components/ui/ObjectBaseInfoCard.jsx'
import { useListResource } from '../../hooks/useListResource.js'
import ObjectListView from '../shared/ObjectListView.jsx'

export default function CarriersList() {
    const { items: carriers, loading, reload } = useListResource(() => api.get('/api/logistic/carriers/'), [])

    const handleDelete = async (id) => {
        await api.delete(`/api/logistic/carriers/${id}/`)
        await reload()
    }

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
                    onDelete={() => handleDelete(w.id)}
                />
            )}
        />
    )
}
