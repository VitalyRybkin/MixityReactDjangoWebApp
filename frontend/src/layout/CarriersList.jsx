import { useEffect, useState } from 'react'

import api from '../api'
import ListInfoCard from '../components/ListInfoCard'
import UniversalListView from '../components/UniversalListView'

export default function CarriersList() {
    const [carriers, setCarriers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        ;(async () => {
            try {
                setLoading(true)
                const res = await api.get('/api/logistic/carriers/')
                const data = Array.isArray(res.data) ? res.data : (res.data.results ?? [])
                if (mounted) setCarriers(data)
            } catch (e) {
                if (mounted) setCarriers([]) // optional
            } finally {
                if (mounted) setLoading(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [])

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
