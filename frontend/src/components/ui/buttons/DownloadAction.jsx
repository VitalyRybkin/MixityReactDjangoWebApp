import React from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function DownloadAction({ sx, loading = false, ...props }) {
    return (
        <IconAction
            title="Скачать"
            disabled={false}
            onClick={loading ? undefined : props.onClick}
            sx={{
                ...sx,
            }}
        >
            {loading ? <CircularProgress size={20} /> : <FileDownloadIcon fontSize="small" />}
        </IconAction>
    )
}
