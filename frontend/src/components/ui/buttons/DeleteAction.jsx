import React from 'react'

import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function DeleteAction({ loading = false, ...props }) {
    return (
        <IconAction
            title={loading ? 'Удаление...' : 'Удалить'}
            {...props}
            disabled={props.disabled || loading}
            sx={{
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                    color: 'error.main',
                },
                ...props.sx,
            }}
        >
            {loading ? (
                <CircularProgress size={18} />
            ) : (
                <DeleteIcon fontSize="small" />
            )}
        </IconAction>
    )
}