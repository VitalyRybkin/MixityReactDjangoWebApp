import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'

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
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs />

            {isLoading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 6,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer sx={{ mt: 4 }}>
                    <Table size="small">
                        <TableBody>
                            {products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    hover
                                    onClick={() => navigate(`/catalog/${product.id}`)}
                                    sx={{
                                        cursor: 'pointer',
                                        '& td': {
                                            py: 0.7,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        },
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            width: '36%',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {product.name}
                                    </TableCell>

                                    <TableCell sx={{ color: 'text.secondary' }}>{product.title}</TableCell>
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
