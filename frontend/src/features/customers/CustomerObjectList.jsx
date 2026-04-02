import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
    Box,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import useSnackbar from '../../hooks/useSnackbar.js'

import { useDeleteCustomerObject, useGetCustomerObjects } from './customers.queries.js'

const tableHeaders = ['Тип', 'Грузоподъемность', 'Госномер', 'Примечание', '']

export default function CustomerObjectListPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { data: customer_objects = [], isPending, error, refetch } = useGetCustomerObjects(id)

    const location = useLocation()
    const entity = location.state?.entity

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({ askConfirm, showSnackbar })

    const deleteCustomerObjectMutation = useDeleteCustomerObject()

    const handleDeleteObject = (construction_object) => {
        confirmDelete({
            item: construction_object,
            mutateAsync: deleteCustomerObjectMutation.mutateAsync,
            refetch,
            title: 'Удалить объект?',
            text: (item) => `Вы действительно хотите удалить "${item.truckType?.truckType}"?`,
            successMessage: 'Объект удален!',
        })
    }

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                    Объекты
                </Typography>
                <AddAction
                    onClick={() =>
                        navigate(`/customers/${entity?.id}/customer_objects/create`, {
                            state: { entity },
                        })
                    }
                />
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
                            {customer_objects.length > 0 ? (
                                customer_objects.map((truck) => <TableRow key={truck.id} hover></TableRow>)
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={tableHeaders.length}
                                        align="left"
                                        sx={{ py: 3, color: 'text.secondary' }}
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

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
