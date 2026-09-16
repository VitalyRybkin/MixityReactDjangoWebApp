import { useState } from 'react'

const getInitialState = () => ({
    open: false,
    mode: 'create',
    item: null,
})

export default function useEntityDialog() {
    const [dialog, setDialog] = useState(getInitialState)

    const openCreate = (event) => {
        event?.currentTarget?.blur?.()

        setDialog({
            open: true,
            mode: 'create',
            item: null,
        })
    }

    const openEdit = (event, item) => {
        event?.currentTarget?.blur?.()

        setDialog({
            open: true,
            mode: 'edit',
            item,
        })
    }

    const close = () => {
        setDialog(getInitialState())
    }

    return {
        dialog,
        openCreate,
        openEdit,
        close,
    }
}
