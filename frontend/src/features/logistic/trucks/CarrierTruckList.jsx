import React from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import {
    Box,
    CircularProgress,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../../components/ui/ErrorState.jsx'
import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'
import EditAction from '../../../components/ui/buttons/EditAction.jsx'

import { useGetCarrierTrucks } from './trucks.queries.js'

const tableHeaders = ['Тип', 'Грузоподъемность', 'Госномер', 'Примечание', '']

export default function CarrierTruckListPage() {
    const { id } = useParams()
    const { data: trucks = [], isPending, error, refetch } = useGetCarrierTrucks(id)

    const location = useLocation()
    const entity = location.state?.entity

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Автотранспорт
                </Typography>
                <AddAction />
                {/*<AddAction onClick={() => navigate(addTo)} />*/}
            </Box>
            <Divider sx={{ mb: 3 }} />

            {error ? (
                <ErrorState error={error} onRetry={refetch} loading={isPending} />
            ) : isPending ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                {tableHeaders.map((head, idx) => (
                                    <TableCell
                                        key={`${head}-${idx}`}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'text.secondary',
                                            fontSize: '0.75rem',
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        {head ? head.toUpperCase() : ''}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {trucks.length > 0 ? (
                                trucks.map((truck) => (
                                    <TableRow key={truck.id} hover>
                                        <TableCell>{truck.truckType?.truckType || '—'}</TableCell>
                                        <TableCell>{truck.capacity?.capacity || '—'}</TableCell>
                                        <TableCell>{truck.licensePlate || '—'}</TableCell>
                                        <TableCell>{truck.description || '—'}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <EditAction
                                                    title="Изменить"
                                                    color="primary"
                                                    onClick={() => onEdit(truck)}
                                                    icon={<EditIcon fontSize="small" />}
                                                />
                                                <DeleteAction onClick={() => onDelete(truck.id)} />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <Typography color="text.secondary" sx={{ p: 2 }}>
                                    Список пуст
                                </Typography>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}
