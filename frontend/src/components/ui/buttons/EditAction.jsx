import React from 'react'

import { IconButton, Tooltip } from '@mui/material'

/**
 * Reusable icon action with tooltip.
 *
 * Props:
 * - title: string (tooltip)
 * - icon: ReactNode (e.g. <EditIcon fontSize="small" />)
 * - color: MUI IconButton color
 * - onClick: function (optional)
 * - to: string (optional)  -> if provided, acts as link
 * - component: component (optional) -> e.g. RouterLink
 * - disabled: boolean
 * - stopPropagation: boolean (default true)
 * - preventDefault: boolean (default false)
 */
export default function EditAction({
    title,
    icon,
    onClick,
    to,
    component,
    disabled = false,
    stopPropagation = true,
    preventDefault = false,
    ...rest
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
                    component={component}
                    to={to}
                    disabled={disabled}
                    onClick={(e) => {
                        if (preventDefault) e.preventDefault()
                        if (stopPropagation) e.stopPropagation()
                        onClick?.(e)
                    }}
                    {...rest}
                >
                    {icon}
                </IconButton>
            </span>
        </Tooltip>
    )
}
