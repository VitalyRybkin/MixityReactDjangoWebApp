import React, { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, Divider } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useFormLogic } from '../../hooks/useEntityForm.js'
import useSnackbar from '../../hooks/useSnackbar.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { useLoadingError } from '../orders/hooks/useLoadingError.js'
import { useUnsavedGuard } from '../orders/hooks/useUnsavedGuard.js'
import { toOrderPayload } from '../orders/utils/order.form.mappers.js'

import { orderFormSx as sx } from './RepairRequestForm.styles.js'
import { useCreateRepairRequest, useGetRepairRequest, useUpdateRepairRequest } from './utils/repair.queries.js'
import { emptyRequestForm } from './utils/request.form.constants.js'

export default function RepairRequestFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const {
        data: repairRequest,
        isPending: loadingRequest,
        error: loadRequestError,
        refetch: refetchRequest,
    } = useGetRepairRequest(id, { enabled: isEdit })

    const createRepairRequest = useCreateRepairRequest()
    const updateRepairRequest = useUpdateRepairRequest()

    const saving = createRepairRequest.isPending || updateRepairRequest.isPending

    const markCleanRef = useRef(null)
    // const { confirmOpen, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)

    const { form, setForm, setError, onChange, onSubmit } = useFormLogic({
        isEdit,
        id,
        emptyForm: emptyRequestForm,
        updateMutation: updateRepairRequest,
        createMutation: createRepairRequest,
        redirectPath: '/repair/requests',
        toPayload: (form) => ({
            ...toOrderPayload(form),
            // products: buildProductsPayload(orderProducts),
            // delivery: {
            //     ...orderDelivery,
            //     carrier: getEntityId(orderDelivery.carrier),
            //     driver: getEntityId(orderDelivery.driver),
            //     truck: getEntityId(orderDelivery.truck),
            // },
        }),
        onSuccess: () => markCleanRef.current?.(),
    })

    useLoadingError(setError, {
        loadRequestError,
    })

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />
            <Box component="form" noValidate onSubmit={onSubmit} sx={sx.form}>
                <Box sx={sx.header}>
                    <PageHeaderCreateUpdate
                        isEdit={isEdit}
                        orderId={form.id}
                        saving={saving}
                        newOrder={'Заявка на ремонт'}
                        editOrder={'Редактирование заявки на ремонт'}
                    />
                </Box>
                <Divider sx={sx.divider} />
            </Box>

            <ConfirmDialog
                // open={confirmOpen}
                title="Есть несохранённые изменения"
                text="Вы изменили форму. Уйти без сохранения?"
                confirmText="Уйти"
                cancelText="Остаться"
                // onClose={handleCancel}
                // onConfirm={handleConfirm}
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
