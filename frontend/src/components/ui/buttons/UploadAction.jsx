import React from 'react'

import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'

import IconAction from './IconAction.jsx'

export default function UploadAction({ ...props }) {
    return (
        <IconAction title="Добавить" {...props}>
            <FileUploadOutlinedIcon fontSize="small" />
        </IconAction>
    )
}
