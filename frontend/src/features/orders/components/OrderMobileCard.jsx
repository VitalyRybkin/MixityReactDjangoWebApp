import { Box, Card, CardActions, CardContent, Divider, Stack, Typography } from '@mui/material'
import {ORDER_STATUS_LABELS} from "../../../utils/localeDataGridText.js";
import {formatDateTime, formatTime} from "../../../utils/DateTimeFormatting.js";
import FileUploadAction from "../../../components/FileUploadAction.jsx";
import DeleteAction from "../../../components/ui/buttons/DeleteAction.jsx";

const sx = {
    card: {
        width: '100%',
        minWidth: 0,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
    },

    clickableContent: {
        cursor: 'pointer',
    },

    content: {
        p: 2,
        '&:last-child': {
            pb: 2,
        },
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
    },

    orderNumber: {
        fontWeight: 600,
    },

    status: {
        color: 'text.secondary',
        textAlign: 'right',
    },

    divider: {
        my: 1.5,
    },

    details: {
        gap: 1,
    },

    row: {
        display: 'grid',
        gridTemplateColumns: '110px minmax(0, 1fr)',
        gap: 1,
        alignItems: 'start',
    },

    label: {
        color: 'text.secondary',
    },

    value: {
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    actions: {
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
    },
}

export default function OrderMobileCard({ order, onOpen, onDelete, onUploadUpd }) {
    const deliveryWindow = `${formatTime(order.delivery_from)} – ${formatTime(order.delivery_to)}`
    const status = ORDER_STATUS_LABELS[order.status] ?? order.status ?? '—'

    return (
        <Card sx={sx.card}>
            <Box
                role="button"
                tabIndex={0}
                sx={sx.clickableContent}
                onClick={() => onOpen(order.id)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpen(order.id)
                    }
                }}
            >
                <CardContent sx={sx.content}>
                    <Box sx={sx.header}>
                        <Typography variant="h6" sx={sx.orderNumber}>
                            Заявка №{order.id}
                        </Typography>

                        <Typography variant="body2" sx={sx.status}>
                            {status}
                        </Typography>
                    </Box>

                    <Divider sx={sx.divider} />

                    <Stack sx={sx.details}>
                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Дата заявки
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {formatDateTime(order.created_at)}
                            </Typography>
                        </Box>

                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Клиент
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {order.client?.name ?? '—'}
                            </Typography>
                        </Box>

                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Контрагент
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {order.customer?.name ?? '—'}
                            </Typography>
                        </Box>

                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Адрес
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {order.customer_object?.address ?? 'самовывоз'}
                            </Typography>
                        </Box>

                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Доставка
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {formatDateTime(order.delivery_date)}
                            </Typography>
                        </Box>

                        <Box sx={sx.row}>
                            <Typography variant="body2" sx={sx.label}>
                                Время
                            </Typography>
                            <Typography variant="body2" sx={sx.value}>
                                {deliveryWindow}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Box>

            <CardActions sx={sx.actions}>
                <FileUploadAction
                    entityId={order.id}
                    fileUrl={order.upd_pdf}
                    onUpload={onUploadUpd}
                    uploadTitle="Загрузить УПД"
                    viewTitle="Просмотр УПД"
                />

                <DeleteAction
                    title="Удалить заявку"
                    onClick={() => onDelete(order)}
                    stopPropagation
                    preventDefault
                />
            </CardActions>
        </Card>
    )
}
