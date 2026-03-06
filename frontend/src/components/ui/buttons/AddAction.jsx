import React from 'react'

import AddIcon from '@mui/icons-material/Add'

import IconAction from './IconAction.jsx'

export default function AddAction({ title = 'Добавить', ...props }) {
    return (
        <IconAction title={title} {...props}>
            <AddIcon fontSize="small" />
        </IconAction>
    )
}
