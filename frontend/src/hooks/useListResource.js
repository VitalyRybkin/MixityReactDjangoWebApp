import { useEffect, useState } from 'react'

const unwrap = (d) => (Array.isArray(d) ? d : (d?.results ?? []))

export function useListResource(fetcher, deps = []) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true

        ;(async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetcher()
                if (mounted) setItems(unwrap(res.data))
            } catch (e) {
                if (mounted) {
                    setItems([])
                    setError(e)
                }
            } finally {
                if (mounted) setLoading(false)
            }
        })()

        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { items, loading, error, setItems }
}
