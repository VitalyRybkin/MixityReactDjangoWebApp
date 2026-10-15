import { useCallback, useEffect, useRef, useState } from 'react'

export function useFormDirty({ form, enabled = true }) {
    const initialSnapshotRef = useRef(null)
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (!enabled) {
            return
        }

        if (initialSnapshotRef.current === null) {
            initialSnapshotRef.current = JSON.stringify(form)
            setIsDirty(false)
            return
        }

        setIsDirty(JSON.stringify(form) !== initialSnapshotRef.current)
    }, [form, enabled])

    const markClean = useCallback(() => {
        initialSnapshotRef.current = JSON.stringify(form)
        setIsDirty(false)
    }, [form])

    const resetSnapshot = useCallback((value) => {
        initialSnapshotRef.current = JSON.stringify(value)
        setIsDirty(false)
    }, [])

    return {
        isDirty,
        markClean,
        resetSnapshot,
    }
}
