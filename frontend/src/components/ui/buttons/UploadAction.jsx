import FileDownloadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import CircularProgress from '@mui/material/CircularProgress'

import IconAction from './IconAction.jsx'

export default function UploadAction({ loading = false, disabled = false, ...props }) {
    return (
        <IconAction {...props} disabled={disabled || loading}>
            {loading ? <CircularProgress size={18} /> : <FileDownloadOutlinedIcon fontSize="small" />}
        </IconAction>
    )
}
