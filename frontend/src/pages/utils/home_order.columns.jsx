// Defines order grid columns with optional UPD upload and deletion controls.

import FileUploadAction from '../../components/FileUploadAction.jsx'
import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import { formatDateTime, formatTime } from '../../utils/DateTimeFormatting.js'
import { ORDER_STATUS_LABELS } from '../../utils/localeDataGridText.js'

// Builds display columns and includes actions allowed by the caller.
export const getHomeGridOrderColumns = ({ onDelete, onUploadUpd, canDelete = false, canManageUpd = false }) => [
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
        // Formats the order creation date for display.
        valueGetter: (_, row) => formatDateTime(row.order_date),
    },
    {
        field: 'client_name',
        headerName: 'Поставщик',
        flex: 0.8,
        minWidth: 150,
        // Reads the supplier name with a placeholder when absent.
        valueGetter: (_, row) => row.client?.name ?? '—',
    },
    {
        field: 'customer_name',
        headerName: 'Контрагент',
        flex: 1,
        minWidth: 160,
        // Reads the customer name with a placeholder when absent.
        valueGetter: (_, row) => row.customer?.name ?? '—',
    },
    {
        field: 'address',
        headerName: 'Адрес',
        flex: 1.2,
        minWidth: 180,
        // Shows the delivery address or the pickup label.
        valueGetter: (_, row) => row.customer_object?.address ?? 'самовывоз',
    },
    {
        field: 'delivery_date',
        headerName: 'Дата доставки',
        flex: 0.7,
        minWidth: 150,
        // Formats the scheduled delivery date for display.
        valueGetter: (_, row) => formatDateTime(row.delivery_date),
    },
    {
        field: 'delivery_window',
        headerName: 'Время доставки',
        flex: 0.8,
        minWidth: 170,
        // Combines delivery start and end times into a time window.
        valueGetter: (_, row) => `${formatTime(row.delivery_from)} – ${formatTime(row.delivery_to)}`,
    },
    {
        field: 'status',
        headerName: 'Статус',
        flex: 1,
        minWidth: 140,
        // Resolves the localized status label with a fallback value.
        valueGetter: (_, row) => ORDER_STATUS_LABELS[row.status] ?? row.status ?? '—',
    },
    ...(canManageUpd
        ? [
              {
                  field: 'upd_pdf',
                  headerName: 'УПД',
                  width: 90,
                  minWidth: 90,
                  sortable: false,
                  filterable: false,
                  // Renders the order's UPD upload and preview control.
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
          ]
        : []),
    ...(canDelete
        ? [
              {
                  field: 'actions',
                  headerName: '',
                  width: 70,
                  minWidth: 70,
                  sortable: false,
                  filterable: false,
                  disableColumnMenu: true,
                  align: 'center',
                  headerAlign: 'center',
                  // Renders the deletion action for this order.
                  renderCell: (params) => (
                      <DeleteAction
                          onClick={
                              // Requests deletion without opening the grid row.
                              (event) => {
                                  event.stopPropagation()
                                  event.currentTarget.blur()
                                  onDelete(params.row)
                              }
                          }
                      />
                  ),
              },
          ]
        : []),
]
