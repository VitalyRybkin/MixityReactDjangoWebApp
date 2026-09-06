import React from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import PhoneIcon from '@mui/icons-material/Phone'
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material'

import { objectListViewRowSx as sx } from './ObjectListViewRow.styles.js'
import { Separator } from './ui/Separator.jsx'
import DeleteAction from './ui/buttons/DeleteAction.jsx'
import EditAction from './ui/buttons/EditAction.jsx'
import EmailLink from './ui/buttons/EmailLink.jsx'
import IconAction from './ui/buttons/IconAction.jsx'
import ViewAction from './ui/buttons/ViewAction.jsx'

const ObjectListViewRow = ({ title, subtitle, address, email, phone, fileUrl, to, onDelete }) => {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <TableRow hover onClick={() => navigate(to)} sx={sx.row}>
            <TableCell sx={sx.titleCell}>{title || 'Без названия'}</TableCell>

            <TableCell sx={sx.detailsCell}>
                <Box sx={sx.details}>
                    {/* Первая строка: организация + адрес */}
                    <Box sx={sx.detailsRow}>
                        {subtitle && (
                            <Typography variant="body2" sx={sx.detail}>
                                {subtitle}
                            </Typography>
                        )}

                        {subtitle && address && <Separator />}

                        {address && (
                            <Typography variant="body2" sx={sx.detail}>
                                {address}
                            </Typography>
                        )}
                    </Box>

                    {/* Вторая строка: email + телефон */}
                    {(email || phone || fileUrl) && (
                        <Box sx={sx.detailsRow}>
                            {email && (
                                <Box onClick={(event) => event.stopPropagation()}>
                                    <EmailLink email={email} />
                                </Box>
                            )}

                            {email && phone && <Separator />}

                            {phone && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <Typography variant="body2">{phone}</Typography>

                                    <IconAction
                                        title="Позвонить"
                                        onClick={() => {
                                            window.location.href = `tel:${phone}`
                                        }}
                                    >
                                        <PhoneIcon fontSize="small" />
                                    </IconAction>
                                </Stack>
                            )}

                            {(email || phone) && fileUrl && <Separator />}

                            {fileUrl && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <Typography variant="body2">Схема проезда</Typography>

                                    <ViewAction
                                        title="Схема проезда"
                                        onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                                    />
                                </Stack>
                            )}
                        </Box>
                    )}
                </Box>
            </TableCell>

            <TableCell align="right" sx={sx.actionsCell} onClick={(event) => event.stopPropagation()}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <EditAction
                        component={RouterLink}
                        to={`${to.replace(/\/$/, '')}/edit`}
                        state={{
                            from: location.pathname,
                        }}
                        icon={<EditIcon fontSize="small" />}
                    />

                    <DeleteAction onClick={onDelete} disabled={!onDelete} />
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ObjectListViewRow
