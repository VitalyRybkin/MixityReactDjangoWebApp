import React from 'react'

import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

import IconAction from './IconAction.jsx'

export default function CancelAction({ ...props }) {
    return (
        <IconAction title="Отменить" {...props}>
            <CancelOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />{' '}
        </IconAction>
    )
}
