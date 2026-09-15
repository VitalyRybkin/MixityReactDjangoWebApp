import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export function useUnsavedGuard(isDirty) {
    const blocker = useBlocker(isDirty)

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!isDirty) {
                return
            }

            event.preventDefault()
            event.returnValue = ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty])

    const confirmOpen = blocker.state === 'blocked'

    const handleConfirm = () => {
        if (blocker.state === 'blocked') {
            blocker.proceed()
        }
    }

    const handleCancel = () => {
        if (blocker.state === 'blocked') {
            blocker.reset()
        }
    }

    return {
        confirmOpen,
        handleConfirm,
        handleCancel,
    }
}
