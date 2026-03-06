import React from 'react'

import { IconButton, Tooltip } from '@mui/material'

export default function IconAction({
    title,
    onClick,
    disabled = false,
    stopPropagation = false,
    preventDefault = false,
    children,
    color = 'primary',
    sx,
}) {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton
                    color={color}
                    sx={(theme) => ({
                        backgroundColor: theme.palette.action.hover,
                        '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                        },
                        ...((typeof sx === 'function' ? sx(theme) : sx) || {}),
                    })}
                    disabled={disabled}
                    onClick={(e) => {
                        if (preventDefault) e.preventDefault()
                        if (stopPropagation) e.stopPropagation()
                        onClick?.(e)
                    }}
                >
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    )
}
