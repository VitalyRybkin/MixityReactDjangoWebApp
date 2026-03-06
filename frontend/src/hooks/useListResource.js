import { useCallback, useEffect, useState } from 'react'

const unwrap = (d) => {
    if (Array.isArray(d)) return d
    if (Array.isArray(d?.results)) return d.results
    throw new Error('Expected list response')
}

export function useListResource(fetcher, deps = []) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetcher()
            setItems(unwrap(res.data))
        } catch (e) {
            setItems([])
            setError(e)
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    useEffect(() => {
        load()
    }, [load])

    return { items, loading, error, setItems, reload: load }
}
