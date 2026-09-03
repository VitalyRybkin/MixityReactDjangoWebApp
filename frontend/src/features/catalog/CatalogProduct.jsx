import React from 'react'
import { useParams } from 'react-router-dom'

import { Box, Divider, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'

import { useGetProduct } from './utils/catalog.queries.js'

export default function CatalogProduct() {
    const { id } = useParams()
    const { data: product, isPending: loadingProduct, error: loadError } = useGetProduct(id)

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs />
            <Typography variant="h4" sx={{ p: 3 }}>
                Редактирование материала
            </Typography>
            <Divider sx={{ mb: 3 }} />
        </Box>
    )
}
