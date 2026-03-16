import React from 'react'

import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'

import IconAction from './IconAction.jsx'

export default function ViewAction({ ...props }) {
    return (
        <IconAction title="Смотреть" {...props}>
            <InsertDriveFileIcon fontSize="small" />
        </IconAction>
    )
}
