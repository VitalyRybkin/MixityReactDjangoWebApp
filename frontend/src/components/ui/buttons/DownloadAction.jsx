import React from 'react'

import FileDownloadIcon from '@mui/icons-material/FileDownload'


import IconAction from './IconAction.jsx'

export default function DownloadAction(props) {
    return (
        <IconAction title="Скачать" {...props}>
            <FileDownloadIcon fontSize="small" />
        </IconAction>
    )
}
