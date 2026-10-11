import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, Divider } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeaderCreateUpdate from '../../components/PageHeaderCreateUpdate.jsx'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'

import { orderFormSx as sx } from './RepairRequestForm.styles.js'
import { useCreateRepairRequest, useGetRepairRequest, useUpdateRepairRequest } from './utils/repair.queries.js'

export default function RepairRequestFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const {
        data: repairRequest,
        isPending: loadingRequest,
        error: loadRequestError,
        refetch: refetchRequest,
    } = useGetRepairRequest(id, { enabled: isEdit })

    const createRepairRequest = useCreateRepairRequest()
    const updateRepairRequest = useUpdateRepairRequest()

    const saving = createRepairRequest.isPending || updateRepairRequest.isPending

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />
            <Box
                component="form"
                noValidate
                // onSubmit={onSubmit}
                sx={sx.form}
            >
                <Box sx={sx.header}>
                    <PageHeaderCreateUpdate
                        isEdit={isEdit}
                        // orderId={form.id}
                        saving={saving}
                        newOrder={'Заявка на ремонт'}
                        editOrder={'Редактирование заявки на ремонт'}
                    />
                </Box>
                <Divider sx={sx.divider} />
            </Box>
        </Box>
    )
}
