import { useState } from 'react'

const initialState = {
    open: false,
    title: '',
    text: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'error',
    onConfirm: null,
}

export default function useConfirm() {
    const [confirm, setConfirm] = useState(initialState)

    const askConfirm = ({
        title = 'Confirm action',
        text = '',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmColor = 'error',
        onConfirm,
    }) => {
        setConfirm({
            open: true,
            title,
            text,
            confirmText,
            cancelText,
            confirmColor,
            onConfirm,
        })
    }

    const closeConfirm = () => {
        setConfirm(initialState)
    }

    const handleConfirm = async () => {
        try {
            await confirm.onConfirm?.()
        } finally {
            closeConfirm()
        }
    }

    return {
        confirm,
        askConfirm,
        closeConfirm,
        handleConfirm,
    }
}
