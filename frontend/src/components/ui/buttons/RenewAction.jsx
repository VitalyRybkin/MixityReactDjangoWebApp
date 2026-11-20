import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'

import IconAction from './IconAction.jsx'

export default function RenewAction({ onClick, ...props }) {
    return (
        <IconAction title="Обновить паспорт" aria-label="Обновить паспорт" onClick={onClick} {...props}>
            <AutorenewOutlinedIcon fontSize="small" />
        </IconAction>
    )
}
