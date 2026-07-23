import React from 'react'

import TuneIcon from '@mui/icons-material/Tune'

import IconAction from './IconAction.jsx'

export default function ApplyAction({ ...props }) {
    return (
        <IconAction title="Применить" {...props}>
            <TuneIcon fontSize="small" />
        </IconAction>
    )
}
