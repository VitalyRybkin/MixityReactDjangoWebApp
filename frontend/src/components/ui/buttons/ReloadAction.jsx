import React from 'react'

import CachedIcon from '@mui/icons-material/Cached'

import IconAction from './IconAction.jsx'

export default function ReloadAction({ title = 'Перезагрузить', ...props }) {
    return (
        <IconAction title={title} {...props}>
            <CachedIcon fontSize="small" />
        </IconAction>
    )
}
