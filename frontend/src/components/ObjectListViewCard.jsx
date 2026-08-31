import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import PhoneIcon from '@mui/icons-material/Phone'
import { Box, Card, CardActionArea, CardContent, Divider, Stack, Typography } from '@mui/material'

import DeleteAction from './ui/buttons/DeleteAction.jsx'
import EditAction from './ui/buttons/EditAction.jsx'
import EmailLink from './ui/buttons/EmailLink.jsx'
import IconAction from './ui/buttons/IconAction.jsx'
import ViewAction from './ui/buttons/ViewAction.jsx'

const sx = {
    card: {
        width: '100%',
        minWidth: 0,
        mb: 0,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
    },

    cardAction: {
        cursor: 'pointer',
    },

    content: {
        p: { xs: 2, sm: 2.5 },
        '&:last-child': {
            pb: { xs: 2, sm: 2.5 },
        },
    },

    header: {
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1,
    },

    title: {
        m: 0,
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    actions: {
        flexShrink: 0,
        alignSelf: { xs: 'flex-end', sm: 'center' },
    },

    divider: {
        my: 1.5,
    },

    details: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        minWidth: 0,
        color: 'text.secondary',
        fontSize: '0.875rem',
        columnGap: { xs: 2, md: 0 },
        rowGap: 1,
    },

    detailText: {
        minWidth: 0,
        maxWidth: '100%',
        overflowWrap: 'anywhere',
    },

    detailDivider: {
        mx: 2,
        height: 14,
        alignSelf: 'center',
        display: { xs: 'none', md: 'block' },
    },

    inlineDetail: {
        minWidth: 0,
        maxWidth: '100%',
    },

    directionsLabel: {
        mr: 0.5,
        alignSelf: 'center',
    },
}

const ObjectListViewCard = ({ title, subtitle, address, email, phone, fileUrl, to, onDelete }) => {
    const navigate = useNavigate()
    const location = useLocation()

    const hasDetailsBeforePhone = Boolean(subtitle || address || email)
    const hasDetailsBeforeFile = Boolean(subtitle || address || email || phone)

    return (
        <Card sx={sx.card}>
            <CardActionArea component="div" onClick={() => navigate(to)} sx={sx.cardAction}>
                <CardContent sx={sx.content}>
                    <Stack sx={sx.header}>
                        <Typography variant="h6" sx={sx.title}>
                            {title || 'Без названия'}
                        </Typography>

                        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={sx.actions}>
                            <EditAction
                                component={RouterLink}
                                to={`${to.replace(/\/$/, '')}/edit`}
                                state={{ from: location.pathname }}
                                icon={<EditIcon fontSize="small" />}
                            />

                            <DeleteAction onClick={onDelete} disabled={!onDelete} stopPropagation preventDefault />
                        </Stack>
                    </Stack>

                    <Divider sx={sx.divider} />

                    <Box sx={sx.details}>
                        {subtitle && (
                            <Box component="span" sx={sx.detailText}>
                                {subtitle}
                            </Box>
                        )}

                        {address && (
                            <>
                                {subtitle && <Divider orientation="vertical" flexItem sx={sx.detailDivider} />}

                                <Box component="span" sx={sx.detailText}>
                                    {address}
                                </Box>
                            </>
                        )}

                        {email && (
                            <>
                                {(subtitle || address) && (
                                    <Divider orientation="vertical" flexItem sx={sx.detailDivider} />
                                )}

                                <Box sx={sx.inlineDetail}>
                                    <EmailLink email={email} />
                                </Box>
                            </>
                        )}

                        {phone && (
                            <>
                                {hasDetailsBeforePhone && (
                                    <Divider orientation="vertical" flexItem sx={sx.detailDivider} />
                                )}

                                <Stack direction="row" alignItems="center" spacing={0.5} sx={sx.inlineDetail}>
                                    <Typography variant="body2" sx={sx.detailText}>
                                        {phone}
                                    </Typography>

                                    <IconAction
                                        title="Позвонить"
                                        stopPropagation
                                        preventDefault
                                        onClick={() => {
                                            window.location.href = `tel:${phone}`
                                        }}
                                    >
                                        <PhoneIcon fontSize="small" />
                                    </IconAction>
                                </Stack>
                            </>
                        )}

                        {fileUrl && (
                            <>
                                {hasDetailsBeforeFile && (
                                    <Divider orientation="vertical" flexItem sx={sx.detailDivider} />
                                )}

                                <Stack direction="row" alignItems="center" sx={sx.inlineDetail}>
                                    <Typography variant="body2" sx={sx.directionsLabel}>
                                        Схема проезда
                                    </Typography>

                                    <ViewAction
                                        title="Схема проезда"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            event.preventDefault()
                                            window.open(fileUrl, '_blank', 'noopener,noreferrer')
                                        }}
                                    />
                                </Stack>
                            </>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}

export default ObjectListViewCard
