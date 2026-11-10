import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import { Box, ButtonBase, CircularProgress, Divider, Typography } from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import AppSnackbar from '../../components/ui/feedback/AppSnackbar.jsx'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'

import { catalogSx as sx } from './Catalog.styles.js'
import CatalogPassportStatus from './components/CatalogPassportStatus.jsx'
import { useGetProducts } from './utils/catalog.queries.js'

export default function CatalogPage() {
    const navigate = useNavigate()
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })
    const { data: products = [], isLoading, isError } = useGetProducts()

    useEffect(() => {
        if (isError) {
            setSnackbar({ open: true, message: 'Ошибка загрузки данных', severity: 'error' })
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
                <Box sx={sx.list} role="list" aria-label="Каталог продукции">
                    {products.length === 0 && (
                        <Typography color="text.secondary" sx={sx.empty}>
                            Продукция не найдена.
                        </Typography>
                    )}
                    {products.map((product) => (
                        <Box key={product.id} role="listitem" sx={sx.productCard}>
                            <ButtonBase
                                sx={sx.productButton}
                                onClick={() => navigate(`/catalog/products/${product.id}`)}
                                aria-label={`Открыть продукцию ${product.name}`}
                            >
                                <Box sx={sx.productText}>
                                    <Typography sx={sx.productName}>{product.name}</Typography>
                                    {product.title && (
                                        <Typography variant="body2" color="text.secondary" sx={sx.productTitle}>
                                            {product.title}
                                        </Typography>
                                    )}
                                </Box>
                                <ChevronRightOutlinedIcon fontSize="small" sx={sx.chevron} />
                            </ButtonBase>
                            <Box sx={sx.passportCell}>
                                <CatalogPassportStatus productId={product.id} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            <AppSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    )
}
