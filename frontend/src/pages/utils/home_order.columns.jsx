import FileUploadAction from '../../components/FileUploadAction.jsx'
import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import { formatDateTime, formatTime } from '../../utils/DateTimeFormatting.js'
import { ORDER_STATUS_LABELS } from '../../utils/localeDataGridText.js'

export const getHomeGridOrderColumns = ({ onDelete, onUploadUpd }) => [
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
        width: 90,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: 'center',
        renderCell: ({ row }) => (
            <FileUploadAction
                entityId={row.id}
                fileUrl={row.upd_pdf}
                onUpload={onUploadUpd}
                uploadTitle="Загрузить"
                viewTitle="Просмотр"
            />
        ),
    },
    {
        field: 'actions',
        headerName: '',
        width: 70,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: 'center',
        renderCell: ({ row }) => (
            <DeleteAction
                onClick={(event) => {
                    event.stopPropagation()
                    event.currentTarget.blur()
                    onDelete(row)
                }}
            />
        ),
    },
]
