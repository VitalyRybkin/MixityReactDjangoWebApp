import EmailIcon from '@mui/icons-material/Email'
import { Stack, Typography } from '@mui/material'

import IconAction from './IconAction.jsx'

const EmailLink = ({ email, sx }) => (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={sx}>
        <Typography variant="body2" fontWeight={500}>
            {email}
        </Typography>

        <IconAction
            title="Написать"
            stopPropagation
            preventDefault
            onClick={() => {
                window.location.href = `mailto:${email}`
            }}
        >
            <EmailIcon fontSize="small" />
        </IconAction>
    </Stack>
)

export default EmailLink
