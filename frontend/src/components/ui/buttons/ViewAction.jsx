import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import IconAction from './IconAction.jsx'

export default function ViewAction({ onClick, ...props }) {
    return (
        <IconAction title="Просмотр паспорта" aria-label="Просмотр паспорта" onClick={onClick} {...props}>
            <VisibilityOutlinedIcon fontSize="small" />
        </IconAction>
    )
}
