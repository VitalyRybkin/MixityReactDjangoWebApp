import React from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function DownloadAction({ loading = false, disabled = false, onClick, sx, ...props }) {
    const isDisabled = disabled || loading

    return (
        <IconAction
            title="Скачать"
            {...props}
            disabled={disabled && !loading}
            onClick={isDisabled ? undefined : onClick}
            sx={sx}
        >
            {loading ? <CircularProgress size={20} /> : <FileDownloadIcon fontSize="small" />}
        </IconAction>
    )
}
