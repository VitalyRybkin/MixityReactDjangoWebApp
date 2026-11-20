import FileUploadAction from '../../../components/FileUploadAction.jsx'
import { formatDateTime, formatTime } from '../../../utils/DateTimeFormatting.js'
import { ORDER_STATUS_LABELS } from '../../../utils/localeDataGridText.js'

export const getFilterGridOrderColumns = ({ onUploadUpd, onViewUpd }) => [
    {
        field: 'id',
        headerName: '№',
        flex: 0.4,
        minWidth: 70,
    },
    {
        field: 'order_date',
        headerName: 'Дата заявки',
        flex: 0.7,
        minWidth: 140,
        valueGetter: (_, row) => formatDateTime(row.order_date),
    },
    {
        field: 'client_name',
        headerName: 'Поставщик',
        flex: 0.8,
        minWidth: 150,
        valueGetter: (_, row) => row.client?.name ?? '—',
    },
    {
        field: 'customer_name',
        headerName: 'Контрагент',
        flex: 1,
        minWidth: 160,
        valueGetter: (_, row) => row.customer?.name ?? '—',
    },
    {
        field: 'address',
        headerName: 'Адрес',
        flex: 1.2,
        minWidth: 180,
        valueGetter: (_, row) => row.customer_object?.address ?? 'самовывоз',
    },
    {
        field: 'delivery_date',
        headerName: 'Дата доставки',
        flex: 0.7,
        minWidth: 150,
        valueGetter: (_, row) => formatDateTime(row.delivery_date),
    },
    {
        field: 'delivery_window',
        headerName: 'Время доставки',
        flex: 0.8,
        minWidth: 170,
        valueGetter: (_, row) => `${formatTime(row.delivery_from)} – ${formatTime(row.delivery_to)}`,
    },
    {
        field: 'status',
        headerName: 'Статус',
        flex: 1,
        minWidth: 140,
        valueGetter: (_, row) => ORDER_STATUS_LABELS[row.status] ?? row.status ?? '—',
    },
    {
        field: 'upd_pdf',
        headerName: 'УПД',
        width: 120,
        minWidth: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
            <FileUploadAction
                entityId={row.id}
                fileUrl={row.upd_pdf}
                onUpload={onUploadUpd}
                onView={onViewUpd}
                uploadTitle="Загрузить"
                viewTitle="Просмотр"
            />
        ),
    },
]
