import React from 'react'

import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function ResetAction({ loading = false, disabled = false, onClick, ...props }) {
    const isDisabled = disabled || loading

    return (
        <IconAction
            title="Сбросить"
            {...props}
            disabled={disabled && !loading}
            onClick={isDisabled ? undefined : onClick}
        >
            {loading ? <CircularProgress size={20} /> : <RestartAltOutlinedIcon fontSize="small" />}
        </IconAction>
    )
}
