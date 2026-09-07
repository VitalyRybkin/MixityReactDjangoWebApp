import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Box, CircularProgress, Divider, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import { useGetCustomers } from '../customers/utils/customers.queries.js'
import { useGetWarehouses } from '../warehouses/utils/stocks.queries.js'

import { catalogProductSx as sx } from './CatalogProduct.styles.js'
import PriceDialog from './PriceDialog.jsx'
import PriceHistory from './PriceHistory.jsx'
import PriceSidebar from './PriceSidebar.jsx'
import {
    useCreatePurchasePrice,
    useCreateSalesPrice,
    useDeletePurchasePrice,
    useDeleteSalesPrice,
    useGetProduct,
    useGetPurchasePrices,
    useGetSalesPrices,
    useUpdatePurchasePrice,
    useUpdateSalesPrice,
} from './utils/catalog.queries.js'

export default function CatalogProduct() {
    const { id } = useParams()

    const [selection, setSelection] = useState(null)
    const [page, setPage] = useState(1)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPrice, setEditingPrice] = useState(null)

    const { data: product, isPending: loadingProduct, error: productError } = useGetProduct(id)
    const { data: customers = [], isPending: loadingCustomers } = useGetCustomers()
    const { data: warehouses = [], isPending: loadingWarehouses } = useGetWarehouses()

    const customerId = selection?.type === 'sale' ? selection.entity.id : null
    const warehouseId = selection?.type === 'purchase' ? selection.entity.id : null

    const salesQuery = useGetSalesPrices(id, customerId, page)
    const purchaseQuery = useGetPurchasePrices(id, warehouseId, page)

    const createSalesPrice = useCreateSalesPrice(id)
    const updateSalesPrice = useUpdateSalesPrice(id)

    const createPurchasePrice = useCreatePurchasePrice(id)
    const updatePurchasePrice = useUpdatePurchasePrice(id)

    const activeQuery = selection?.type === 'sale' ? salesQuery : purchaseQuery

    const createMutation = selection?.type === 'sale' ? createSalesPrice : createPurchasePrice
    const updateMutation = selection?.type === 'sale' ? updateSalesPrice : updatePurchasePrice
    const deleteSalesPrice = useDeleteSalesPrice(id)
    const deletePurchasePrice = useDeletePurchasePrice(id)

    const deleteMutation = selection?.type === 'sale' ? deleteSalesPrice : deletePurchasePrice

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    })

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity,
        })
    }

    const handleSelect = (nextSelection) => {
        setSelection(nextSelection)
        setPage(1)
        setEditingPrice(null)
        setDialogOpen(false)
    }

    const handleAdd = () => {
        if (!selection) {
            return
        }

        setEditingPrice(null)
        setDialogOpen(true)
    }

    const handleEdit = (price) => {
        console.log('handleEdit price:', price)
        console.log('price id:', price?.id)

        setEditingPrice(price)
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setEditingPrice(null)
    }

    const handlePriceSaved = () => {
        const message = editingPrice ? 'Цена изменена' : 'Цена добавлена'

        handleCloseDialog()
        showSnackbar(message)
    }

    const handlePriceDeleted = () => {
        handleCloseDialog()
        showSnackbar('Цена удалена')
    }

    const handlePriceError = (message) => {
        showSnackbar(message || 'Не удалось выполнить операцию', 'error')
    }

    if (loadingProduct || loadingCustomers || loadingWarehouses) {
        return (
            <Box sx={sx.loading}>
                <CircularProgress />
            </Box>
        )
    }

    if (productError) {
        return (
            <Box sx={sx.page}>
                <AppSnackbar open severity="error" message="Не удалось загрузить товар" />
            </Box>
        )
    }

    if (!product) {
        return null
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs />

            <Typography variant="h4" sx={sx.title}>
                История цен — {product.name}
            </Typography>

            <Divider sx={sx.divider} />

            <Box sx={sx.layout}>
                <PriceSidebar
                    customers={customers}
                    warehouses={warehouses}
                    selection={selection}
                    onSelect={handleSelect}
                />

                <PriceHistory
                    selection={selection}
                    data={activeQuery.data}
                    loading={activeQuery.isPending}
                    error={activeQuery.error}
                    page={page}
                    onPageChange={setPage}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                />
            </Box>

            <PriceDialog
                open={dialogOpen}
                selection={selection}
                price={editingPrice}
                createMutation={createMutation}
                updateMutation={updateMutation}
                deleteMutation={deleteMutation}
                onClose={handleCloseDialog}
                onSuccess={handlePriceSaved}
                onDeleted={handlePriceDeleted}
                onError={handlePriceError}
            />

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() =>
                    setSnackbar((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
            />
        </Box>
    )
}
