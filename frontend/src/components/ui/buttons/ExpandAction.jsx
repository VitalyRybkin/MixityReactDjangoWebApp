import React from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button } from '@mui/material'

export default function ExpandAction({ open, onClick, ...props }) {
    return (
        <Button onClick={onClick} endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ mt: 1 }} {...props}>
            Фильтры
        </Button>
    )
}
