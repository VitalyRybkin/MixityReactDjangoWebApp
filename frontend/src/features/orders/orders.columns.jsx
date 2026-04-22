import { IconButton } from '@mui/material'

import DownAction from '../../components/ui/buttons/DownAction.jsx'
import ViewAction from '../../components/ui/buttons/ViewAction.jsx'

const ORDER_STATUS_LABELS = {
    draft: 'Черновик',
    created: 'Создана',
    in_progress: 'В работе',
    done: 'Завершена',
    cancelled: 'Отменена',
}

const formatTime = (value) => {
    if (!value) return '—'
    return value.slice(0, 5)
}

const formatDateTime = (value) => {
    if (!value) return '—'

    const date = new Date(value)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    // const hours = String(date.getHours()).padStart(2, '0')
    // const minutes = String(date.getMinutes()).padStart(2, '0')

    // return `${day}.${month}.${year} [ ${hours}:${minutes} ]`
    return `${day}.${month}.${year}`
}

export const getOrdersColumns = () => [
    { field: 'id', headerName: '№', flex: 0.4 },
    {
        field: 'created_at',
        headerName: 'Дата заявки',
        flex: 0.7,
        valueGetter: (_, row) => formatDateTime(row.created_at),
    },
    {
        field: 'client_name',
        headerName: 'Клиент',
        flex: 0.8,
        valueGetter: (_, row) => row.client?.name ?? '—',
    },
    {
        field: 'customer_name',
        headerName: 'Контрагент',
        flex: 1,
        valueGetter: (_, row) => row.customer?.name ?? '—',
    },
    {
        field: 'address',
        headerName: 'Адрес',
        flex: 1.2,
        valueGetter: (_, row) => row.customer_object?.address ?? 'самовывоз',
    },
    { field: 'delivery_date', headerName: 'Дата доставки', flex: 0.7 },
    {
        field: 'delivery_window',
        headerName: 'Время доставки',
        flex: 0.8,
        valueGetter: (_, row) => `${formatTime(row.delivery_from)} – ${formatTime(row.delivery_to)}`,
    },
    {
        field: 'status',
        headerName: 'Статус',
        flex: 1,
        valueGetter: (_, row) => ORDER_STATUS_LABELS[row.status] ?? row.status ?? '—',
    },
    {
        field: 'udp_pdf',
        headerName: 'УПД',
        flex: 0.8,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
            const hasUdpPdf = Boolean(params.row.udp_pdf)

            const handleClick = (event) => {
                event.stopPropagation()

                if (hasUdpPdf) {
                    window.open(params.row.udp_pdf, '_blank')
                } else {
                    console.log('download or generate udp')
                }
            }

            return (
                <IconButton size="small" onClick={handleClick}>
                    {hasUdpPdf ? <ViewAction title="Просмотр" /> : <DownAction title="Загрузить" />}
                </IconButton>
            )
        },
    },
]
