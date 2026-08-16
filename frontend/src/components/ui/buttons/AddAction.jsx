import React from 'react'

import AddIcon from '@mui/icons-material/Add'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function AddAction({ loading = false, disabled = false, onClick, ...props }) {
    const isDisabled = disabled || loading

    return (
        <IconAction
            title="Добавить"
            {...props}
            disabled={disabled && !loading}
            onClick={isDisabled ? undefined : onClick}
        >
            {loading ? <CircularProgress size={20} /> : <AddIcon fontSize="small" />}
        </IconAction>
    )
}
