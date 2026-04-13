import React from 'react'

import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'

import IconAction from './IconAction.jsx'

export default function SaveAction({ ...props }) {
    return (
        <IconAction title="Сохранить" {...props}>
            <SaveOutlinedIcon fontSize="small" />
        </IconAction>
    )
}
