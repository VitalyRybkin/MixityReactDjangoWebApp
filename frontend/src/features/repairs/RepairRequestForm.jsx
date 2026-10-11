import React from 'react'

import { Box } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'

export default function RepairRequestFormPage() {
    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />
        </Box>
    )
}
