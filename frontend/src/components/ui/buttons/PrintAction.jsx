import React from 'react'

import PrintIcon from '@mui/icons-material/Print'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'
import PrintDisabledOutlinedIcon from '@mui/icons-material/PrintDisabledOutlined';

export default function PrintAction({
                                        disabled = false,
                                        loading = false,
                                        onClick,
                                        ...props
                                    }) {
    const isDisabled = disabled || loading

    return (
        <IconAction
            title={loading ? 'Подготовка...' : disabled ? undefined : 'Печать претензии'}
            {...props}
            disabled={isDisabled}
            onClick={isDisabled ? undefined : onClick}
        >
            {loading ? (
                <CircularProgress size={18} />
            ) : disabled ? (
                <PrintDisabledOutlinedIcon fontSize="small" />
            ) : (
                <PrintIcon fontSize="small" />
            )}
        </IconAction>
    )
}