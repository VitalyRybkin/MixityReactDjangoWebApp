import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useUnsavedGuard(isDirty) {
    const navigate = useNavigate()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [nextPath, setNextPath] = useState(null)

    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [isDirty])

    const handleNavigate = (path) => {
        if (isDirty) {
            setNextPath(path)
            setConfirmOpen(true)
            return
        }
        navigate(path)
    }

    const handleConfirm = () => {
        const path = nextPath || '/'
        setConfirmOpen(false)
        setNextPath(null)
        navigate(path)
    }

    const handleCancel = () => {
        setConfirmOpen(false)
        setNextPath(null)
    }

    return { confirmOpen, handleNavigate, handleConfirm, handleCancel }
}
