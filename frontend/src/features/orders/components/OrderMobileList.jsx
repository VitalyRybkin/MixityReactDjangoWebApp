import { useEffect, useMemo, useState } from 'react'

import { Box, CircularProgress, Pagination, Stack, Typography } from '@mui/material'

import OrderMobileCard from './OrderMobileCard.jsx'

const PAGE_SIZE = 10

const sx = {
    root: {
        display: {
            xs: 'block',
            sm: 'none',
        },
        minWidth: 0,
    },

    loading: {
        py: 6,
        display: 'flex',
        justifyContent: 'center',
    },

    empty: {
        py: 4,
        px: 2,
        textAlign: 'center',
        color: 'text.secondary',
    },

    cards: {
        gap: 1.5,
    },

    pagination: {
        mt: 2,
        display: 'flex',
        justifyContent: 'center',
    },
}

export default function OrderMobileList({ orders = [], loading = false, onOpen, onDelete, onUploadUpd }) {
    const [page, setPage] = useState(1)

    const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, pageCount))
    }, [pageCount])

    const visibleOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return orders.slice(start, start + PAGE_SIZE)
    }, [orders, page])

    if (loading) {
        return (
            <Box sx={sx.root}>
                <Box sx={sx.loading}>
                    <CircularProgress />
                </Box>
            </Box>
        )
    }

    if (!orders.length) {
        return (
            <Box sx={sx.root}>
                <Typography sx={sx.empty}>На выбранный период доставки заказов нет.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={sx.root}>
            <Stack sx={sx.cards}>
                {visibleOrders.map((order) => (
                    <OrderMobileCard
                        key={order.id}
                        order={order}
                        onOpen={onOpen}
                        onDelete={onDelete}
                        onUploadUpd={onUploadUpd}
                    />
                ))}
            </Stack>

            {pageCount > 1 && (
                <Box sx={sx.pagination}>
                    <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} size="small" />
                </Box>
            )}
        </Box>
    )
}
