import TuneIcon from '@mui/icons-material/Tune'
import { CircularProgress } from '@mui/material'

import IconAction from './IconAction.jsx'

export default function ApplyAction({sx,
                                        loading = false,
                                        ...props
                                    }) {
    return (
        <IconAction
            title="Применить"
            disabled={false}
            onClick={loading ? undefined : props.onClick}
            sx={{
                ...sx,
            }}
        >
            {loading ? (
                <CircularProgress size={20} />
            ) : (
                <TuneIcon fontSize="small" />
            )}
        </IconAction>
    )
}