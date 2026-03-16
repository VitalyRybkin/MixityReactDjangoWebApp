import React from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import PhoneIcon from '@mui/icons-material/Phone'
import { Box, Card, CardActionArea, CardContent, Divider, Stack, Typography } from '@mui/material'

import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import EditAction from '../../components/ui/buttons/EditAction.jsx'
import EmailLink from '../../components/ui/buttons/EmailLink.jsx'
import IconAction from '../../components/ui/buttons/IconAction.jsx'
import ViewAction from '../../components/ui/buttons/ViewAction.jsx'

const ObjectListViewCard = ({ title, subtitle, extra, email, phone, fileUrl, to, onDelete }) => {
    const hasTextBefore = Boolean(subtitle || extra || email)
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <Card sx={{ width: '100%', mb: 0 }}>
            <CardActionArea component="div" onClick={() => navigate(to)} sx={{ cursor: 'pointer' }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" gutterBottom>
                            {title || 'Без названия'}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <EditAction
                                component={RouterLink}
                                to={`${to.replace(/\/$/, '')}/edit`}
                                state={{ from: location.pathname }}
                                icon={<EditIcon fontSize="small" />}
                            />
                            <DeleteAction onClick={onDelete} disabled={!onDelete} stopPropagation preventDefault />
                        </Stack>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
                        {subtitle && <Box component="span">{subtitle}</Box>}

                        {extra && (
                            <>
                                {subtitle && (
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ mx: 2, height: 14, alignSelf: 'center' }}
                                    />
                                )}
                                <Box component="span">{extra}</Box>
                            </>
                        )}

                        {email && (
                            <>
                                {(subtitle || extra) && (
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ mx: 2, height: 14, alignSelf: 'center' }}
                                    />
                                )}
                                <EmailLink email={email} />
                            </>
                        )}

                        {phone && (
                            <>
                                {(subtitle || extra) && (
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ mx: 2, height: 14, alignSelf: 'center' }}
                                    />
                                )}

                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Typography variant="body2">{phone}</Typography>

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

                        {/* Directions */}
                        {fileUrl && (
                            <>
                                {hasTextBefore && (
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ mx: 2, height: 14, alignSelf: 'center' }}
                                    />
                                )}

                                <Typography variant="body2" sx={{ mr: 0.5, alignSelf: 'center' }}>
                                    Схема проезда
                                </Typography>

                                <ViewAction
                                    title={'Схема проезда'}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        window.open(fileUrl, '_blank')
                                    }}
                                />
                            </>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}

export default ObjectListViewCard
