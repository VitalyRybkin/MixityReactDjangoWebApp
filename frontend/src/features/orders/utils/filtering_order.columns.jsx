import FileUploadAction from '../../../components/FileUploadAction.jsx'
import { formatDateTime, formatTime } from '../../../utils/DateTimeFormatting.js'
import { ORDER_STATUS_LABELS } from '../../../utils/localeDataGridText.js'

export const getFilterGridOrderColumns = ({ onUploadUpd, onViewUpd }) => [
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
    {
        field: 'delivery_date',
        headerName: 'Дата доставки',
        flex: 0.7,
        valueGetter: (_, row) => formatDateTime(row.delivery_date),
    },
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
        field: 'upd_pdf',
        headerName: 'УПД',
        flex: 0.8,
        sortable: false,
        filterable: false,
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
