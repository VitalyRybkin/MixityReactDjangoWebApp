import React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Card, CardActionArea, CardContent, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material'

import DeleteAction from '../../components/ui/DeleteAction.jsx'
import EditAction from '../../components/ui/EditAction.jsx'
import EmailLink from '../../components/ui/EmailLink.jsx'

const ObjectListViewCard = ({ title, subtitle, extra, email, fileUrl, to, onDelete }) => {
    const hasTextBefore = Boolean(subtitle || extra || email)
    const navigate = useNavigate()

    return (
        <Card sx={{ width: '100%', mb: 0 }}>
            <CardActionArea component="div" onClick={() => navigate(to)} sx={{ cursor: 'pointer' }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" gutterBottom>
                            {title || 'Без названия'}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Изменить">
                                <EditAction
                                    title="Изменить"
                                    color="primary"
                                    component={RouterLink}
                                    to={`${to.replace(/\/$/, '')}/edit`}
                                    icon={<EditIcon fontSize="small" />}
                                />
                            </Tooltip>

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

                        {/* PDF */}
                        {fileUrl && (
                            <>
                                {hasTextBefore && (
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ mx: 2, height: 14, alignSelf: 'center' }}
                                    />
                                )}

                                <Tooltip title="Открыть инструкцию (PDF)">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            window.open(fileUrl, '_blank')
                                        }}
                                        sx={{
                                            p: 0,
                                            color: '#d32f2f',
                                            '&:hover': {
                                                color: '#b71c1c',
                                                backgroundColor: 'transparent',
                                            },
                                        }}
                                    >
                                        <PictureAsPdfIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}

export default ObjectListViewCard
