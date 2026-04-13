import React from 'react'

import SaveAltIcon from '@mui/icons-material/SaveAlt'

import IconAction from './IconAction.jsx'

export default function SaveAction({ ...props }) {
    return (
        <IconAction title="Сохранить" {...props}>
            <SaveAltIcon fontSize="small" sx={{ color: 'success.main' }} />
        </IconAction>
    )
}
