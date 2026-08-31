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

import { useDeleteDriver, useGetDrivers } from './utils/drivers.queries.js'

const tableHeaders = ['ФИО', '']

export default function CarrierDriverListPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { data: drivers = [], isPending, error, refetch } = useGetDrivers(id)

    const location = useLocation()
    const entity = location.state?.entity

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({ askConfirm, showSnackbar })

    const deleteDriverMutation = useDeleteDriver()

    const handleDeleteDriver = (driver) => {
        confirmDelete({
            item: driver,
            mutateAsync: deleteDriverMutation.mutateAsync,
            refetch,
            title: 'Удалить водителя?',
            text: (item) => `Вы действительно хотите удалить "${item.fullName}"?`,
            successMessage: 'Водитель удален!',
        })
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box sx={sx.header}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Водители
                </Typography>

                <AddAction
                    onClick={() =>
                        navigate(`/carriers/${entity?.id}/drivers/create`, {
                            state: { entity },
                        })
                    }
                />
            </Box>

            <Divider sx={sx.divider} />

            {error ? (
                <ErrorState error={error} onRetry={refetch} loading={isPending} />
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
                                    <TableCell key={`${head}-${idx}`} sx={sx.tableHeaderCell}>
                                        {head ? head.toUpperCase() : ''}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {drivers.length > 0 ? (
                                drivers.map((driver) => (
                                    <TableRow key={driver.id} hover>
                                        <TableCell>{driver.fullName || '—'}</TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <EditAction
                                                    onClick={() =>
                                                        navigate(`/carriers/${id}/drivers/${driver.id}/edit`, {
                                                            state: { entity },
                                                        })
                                                    }
                                                    icon={<EditIcon fontSize="small" />}
                                                />

                                                <DeleteAction onClick={() => handleDeleteDriver(driver)} />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} align="left" sx={sx.emptyCell}>
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

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
