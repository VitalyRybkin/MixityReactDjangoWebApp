import React from 'react'

import { Box, CircularProgress, Pagination, Typography } from '@mui/material'

import AddAction from '../../components/ui/buttons/AddAction.jsx'

import { catalogProductSx as sx } from './CatalogPrices.styles.js'

const PAGE_SIZE = 10

const formatDate = (date) => {
    if (!date) {
        return ''
    }

    const [year, month, day] = date.split('-')

    return `${day}.${month}.${year}`
}

const formatPrice = (value) => {
    return Number(value).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

export default function PriceHistory({ selection, data, loading, error, page, onPageChange, onAdd, onEdit }) {
    if (!selection) {
        return (
            <Box sx={sx.history}>
                <Typography sx={sx.empty}>Выберите покупателя или склад, чтобы посмотреть историю цен</Typography>
            </Box>
        )
    }

    const isSale = selection.type === 'sale'
    const prices = data?.results ?? []
    const count = data?.count ?? 0
    const pageCount = Math.ceil(count / PAGE_SIZE)
    const priceField = isSale ? 'sale_price' : 'purchase_price'

    return (
        <Box sx={sx.history}>
            <Box sx={sx.historyHeader}>
                <Typography variant="h5" sx={sx.historyTitle}>
                    {selection.entity.name}
                </Typography>

                <AddAction onClick={onAdd} disabled={loading} />
            </Box>

            <Box sx={sx.priceHeader}>
                <Typography>Дата</Typography>

                <Typography>Продукт</Typography>

                <Typography sx={sx.priceHeaderPrice}>Цена</Typography>
            </Box>

            {loading && (
                <Box sx={sx.loading}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && <Typography sx={sx.empty}>Не удалось загрузить историю цен</Typography>}

            {!loading && !error && prices.length === 0 && (
                <Typography sx={sx.empty}>История цен отсутствует</Typography>
            )}

            {!loading &&
                !error &&
                prices.map((price) => (
                    <Box key={price.id} component="button" type="button" onClick={() => onEdit(price)} sx={sx.priceRow}>
                        <Typography sx={sx.date}>{formatDate(price.date)}</Typography>

                        <Typography sx={sx.productName}>{price.product?.name ?? '—'}</Typography>

                        <Typography sx={sx.price}>{formatPrice(price[priceField])} ₽</Typography>
                    </Box>
                ))}

            {!loading && !error && pageCount > 1 && (
                <Box sx={sx.pagination}>
                    <Pagination
                        page={page}
                        count={pageCount}
                        onChange={(_, value) => onPageChange(value)}
                        size="small"
                    />
                </Box>
            )}
        </Box>
    )
}
