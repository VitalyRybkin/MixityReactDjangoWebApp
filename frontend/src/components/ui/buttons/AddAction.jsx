import React from 'react'

import AddIcon from '@mui/icons-material/Add'

import IconAction from './IconAction.jsx'
import CircularProgress from "@mui/material/CircularProgress";

export default function AddAction({  loading, ...props }) {
    return (
        <IconAction title='Добавить' {...props}>
            {loading ? (
                <CircularProgress size={18} />
            ) : (
                <AddIcon fontSize="small" />
            )}
        </IconAction>
    )
}
