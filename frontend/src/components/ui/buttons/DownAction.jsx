import React from 'react'

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'

import IconAction from './IconAction.jsx'

export default function DownAction({ ...props }) {
    return (
        <IconAction title="Добавить" {...props}>
            <FileDownloadOutlinedIcon fontSize="small" />
        </IconAction>
    )
}
