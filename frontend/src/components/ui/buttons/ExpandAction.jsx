import React from 'react'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button } from '@mui/material'

export default function ExpandAction({ open, onClick, sx, ...props }) {
    return (
        <Button
            onClick={onClick}
            endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
                textTransform: 'none',
                ...sx,
            }}
            {...props}
        >
            Фильтры
        </Button>
    )
}
