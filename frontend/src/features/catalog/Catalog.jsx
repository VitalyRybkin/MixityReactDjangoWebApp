import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    Box,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,

} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'

import { catalogSx as sx } from './Catalog.styles.js'
import { useGetProducts } from './utils/catalog.queries.js'

export default function CatalogPage() {
    const navigate = useNavigate()

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'error',
    })

    const { data: products = [], isLoading, isError } = useGetProducts()

    useEffect(() => {
        if (isError) {
            setSnackbar({
                open: true,
                message: 'Ошибка загрузки данных',
                severity: 'error',
            })
        }
    }, [isError])

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />

            <PageHeader title="Каталог продукции" />

            <Divider sx={listSx.divider} />

            {isLoading ? (
                <Box sx={listSx.loading}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small" sx={listSx.table}>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    hover
                                    onClick={() => navigate(`/catalog/products/${product.id}`)}
                                    sx={sx.row}
                                >
                                    <TableCell sx={sx.nameCell}>{product.name}</TableCell>

                                    <TableCell sx={sx.titleCell}>{product.title}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

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
