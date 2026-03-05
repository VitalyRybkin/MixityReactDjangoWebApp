import React from 'react'

import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Tooltip } from '@mui/material'

export default function DeleteAction({
    title = 'Удалить',
    onClick,
    disabled = false,
    stopPropagation = false,
    preventDefault = false,
}) {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton
                    sx={(theme) => ({
                        backgroundColor: theme.palette.action.hover,
                        '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                        },
                    })}
                    color="error"
                    disabled={disabled}
                    onClick={(e) => {
                        if (preventDefault) e.preventDefault()
                        if (stopPropagation) e.stopPropagation()
                        onClick?.(e)
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </span>
        </Tooltip>
    )
}
