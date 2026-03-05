import React from 'react'

import AddIcon from '@mui/icons-material/Add'
import { IconButton, Tooltip } from '@mui/material'

export default function AddAction({
    title = 'Добавить',
    onClick,
    disabled = false,
    stopPropagation = false,
    preventDefault = false,
}) {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton
                    color="primary"
                    sx={(theme) => ({
                        backgroundColor: theme.palette.action.hover,
                        '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                        },
                    })}
                    disabled={disabled}
                    onClick={(e) => {
                        if (preventDefault) e.preventDefault()
                        if (stopPropagation) e.stopPropagation()
                        onClick?.(e)
                    }}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    )
}
