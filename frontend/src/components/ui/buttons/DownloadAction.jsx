import React from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'


import IconAction from './IconAction.jsx'

import CircularProgress from '@mui/material/CircularProgress'

export default function DownloadAction({ loading, ...props }) {
    return (
        <IconAction title="Скачать" {...props}>
            {loading ? (
                <CircularProgress size={18} />
            ) : (
                <FileDownloadIcon fontSize="small" />
            )}
        </IconAction>
    )
}
