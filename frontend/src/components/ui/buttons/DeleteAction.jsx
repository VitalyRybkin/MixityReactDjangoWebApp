import React from 'react'

import DeleteIcon from '@mui/icons-material/Delete'

import IconAction from './IconAction.jsx'

export default function DeleteAction({  ...props }) {
    return (
        <IconAction
            title='Удалить'
            {...props}
            sx={{
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                    color: 'error.main',
                },
                ...props.sx,
            }}
        >
            <DeleteIcon fontSize="small" />
        </IconAction>
    )
}
