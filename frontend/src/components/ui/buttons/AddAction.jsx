import React from 'react'

import AddIcon from '@mui/icons-material/Add'

import IconAction from './IconAction.jsx'

export default function AddAction({  ...props }) {
    return (
        <IconAction title='Добавить' {...props}>
            <AddIcon fontSize="small" />
        </IconAction>
    )
}
