import React from 'react'

import ClearIcon from '@mui/icons-material/Clear'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function DeleteFileAction({ loading = false, disabled = false, sx, ...props }) {
    return (
        <IconAction
            {...props}
            disabled={disabled || loading}
            sx={{
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                    color: 'error.main',
                },
                ...sx,
            }}
        >
            {loading ? <CircularProgress size={18} /> : <ClearIcon fontSize="small" />}
        </IconAction>
    )
}
