import EmailIcon from '@mui/icons-material/Email'
import { Stack, Typography } from '@mui/material'

import IconAction from './IconAction.jsx'

const EmailLink = ({ email, onClick, label, title = 'Написать', sx }) => (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={sx}>
        <Typography variant="body2" fontWeight={500}>
            {label || email}
        </Typography>

        <IconAction
            title={title}
            stopPropagation
            preventDefault
            onClick={email ? () => (window.location.href = `mailto:${email}`) : onClick}
        >
            <EmailIcon fontSize="small" />
        </IconAction>
    </Stack>
)

export default EmailLink
