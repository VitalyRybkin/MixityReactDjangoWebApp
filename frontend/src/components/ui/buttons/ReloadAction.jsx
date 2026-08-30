import React from 'react'

import CachedIcon from '@mui/icons-material/Cached'

import IconAction from './IconAction.jsx'

export default function ReloadAction({ ...props }) {
    return (
        <IconAction title="Перезагрузить" {...props}>
            <CachedIcon fontSize="small" />
        </IconAction>
    )
}
