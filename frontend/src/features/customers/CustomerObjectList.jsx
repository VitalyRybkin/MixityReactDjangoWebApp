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
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import EditAction from '../../components/ui/buttons/EditAction.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js'
import useEntityDialog from '../../hooks/useEntityDialog.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { entityTableListSx as sx } from '../../styles/entityTableList.styles.js'

import CustomerObjectDialog from './CustomerObjectDialog.jsx'
import { useDeleteCustomerObject, useGetCustomerObjects } from './utils/customers.queries.js'


const tableHeaders = ['Наименование', 'Адрес', '']

export default function CustomerObjectListPage() {
    const { id } = useParams()
    const { data: customer_objects = [], isPending, error, refetch } = useGetCustomerObjects(id)

    const location = useLocation()
    const entity = location.state?.entity

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const confirmDelete = useConfirmDelete({ askConfirm, showSnackbar })

    const deleteCustomerObjectMutation = useDeleteCustomerObject()

    const {
        dialog: objectDialog,
        openCreate: handleAddObject,
        openEdit: handleEditObject,
        close: closeObjectDialog,
    } = useEntityDialog()

    const handleObjectSaved = async () => {
        await refetch()

        closeObjectDialog()

        showSnackbar(objectDialog.mode === 'edit' ? 'Объект изменен!' : 'Объект добавлен!', 'success')
    }

    const handleDeleteObject = (constructionObject) => {
        confirmDelete({
            item: constructionObject,
            mutateAsync: (item) =>
                deleteCustomerObjectMutation.mutateAsync({
                    id,
                    objectId: item.id,
                }),
            refetch,
            title: 'Удалить объект?',
            text: (item) => `Вы действительно хотите удалить "${item.name}"?`,
            successMessage: 'Объект удален!',
        })
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <PageHeader title="Строительные объекты" actions={<AddAction onClick={handleAddObject} />} />

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
                            {customer_objects.length > 0 ? (
                                customer_objects.map((co) => (
                                    <TableRow key={co.id} hover>
                                        <TableCell>{co.name}</TableCell>
                                        <TableCell>{co.address}</TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <EditAction
                                                    onClick={(event) => handleEditObject(event, co)}
                                                    icon={<EditIcon fontSize="small" />}
                                                />

                                                <DeleteAction onClick={() => handleDeleteObject(co)} />
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

            <CustomerObjectDialog
                open={objectDialog.open}
                mode={objectDialog.mode}
                customerId={id}
                initialData={objectDialog.item}
                onClose={closeObjectDialog}
                onSaved={handleObjectSaved}
            />

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
