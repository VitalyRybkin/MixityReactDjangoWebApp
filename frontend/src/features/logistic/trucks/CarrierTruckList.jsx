import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

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
import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete.js'
import useSnackbar from '../../../hooks/useSnackbar.js'

import { entityTableListSx as sx } from '../../../styles/entityTableList.styles.js'
import { useDeleteCarrierTruck, useGetCarrierTrucks } from './utils/trucks.queries.js'

const tableHeaders = ['Тип', 'Грузоподъемность', 'Госномер', 'Примечание', '']

export default function CarrierTruckListPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { data: trucks = [], isPending, error, refetch } = useGetCarrierTrucks(id)

    const location = useLocation()
    const entity = location.state?.entity

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({ askConfirm, showSnackbar })

    const deleteCarrierTruckMutation = useDeleteCarrierTruck()

    const handleDeleteTruck = (truck) => {
        confirmDelete({
            item: truck,
            mutateAsync: deleteCarrierTruckMutation.mutateAsync,
            refetch,
            title: 'Удалить автотранспорт?',
            text: (item) => `Вы действительно хотите удалить "${item.truckType?.truckType}"?`,
            successMessage: 'Автотранспорт удален!',
        })
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box sx={sx.header}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Автотранспорт
                </Typography>

                <AddAction
                    onClick={() =>
                        navigate(`/carriers/${entity?.id}/trucks/create`, {
                            state: { entity },
                        })
                    }
                />
            </Box>

            <Divider sx={sx.divider} />

            {error ? (
                <ErrorState
                    error={error}
                    onRetry={refetch}
                    loading={isPending}
                />
            ) : isPending ? (
                <Box sx={sx.loading}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table sx={sx.table}>
                        <TableHead sx={sx.tableHead}>
                            <TableRow>
                                {tableHeaders.map((head, idx) => (
                                    <TableCell
                                        key={`${head}-${idx}`}
                                        sx={sx.tableHeaderCell}
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
                                        <TableCell>
                                            {truck.truckType?.truckType || '—'}
                                        </TableCell>

                                        <TableCell>
                                            {truck.capacity?.capacity || '—'}
                                        </TableCell>

                                        <TableCell>
                                            {truck.licensePlate || '—'}
                                        </TableCell>

                                        <TableCell>
                                            {truck.description || '—'}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                justifyContent="flex-end"
                                            >
                                                <EditAction
                                                    onClick={() =>
                                                        navigate(
                                                            `/carriers/${id}/trucks/${truck.id}/edit`,
                                                            {
                                                                state: { entity },
                                                            },
                                                        )
                                                    }
                                                    icon={
                                                        <EditIcon fontSize="small" />
                                                    }
                                                />

                                                <DeleteAction
                                                    onClick={() =>
                                                        handleDeleteTruck(truck)
                                                    }
                                                />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={tableHeaders.length}
                                        align="left"
                                        sx={sx.emptyCell}
                                    >
                                        Список пуст
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                text={confirm.text}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                confirmColor={confirm.confirmColor}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
            />

            <AppSnackbar
                open={snack.open}
                message={snack.message}
                severity={snack.severity}
                onClose={closeSnackbar}
            />
        </Box>
    )
}