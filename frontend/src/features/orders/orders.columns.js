export const getOrdersColumns = () => [
    { field: 'id', headerName: 'Заявка №', flex: 0.7 },
    {
        field: 'created_at',
        headerName: 'Дата заявки',
        flex: 1.2,
        valueGetter: (_, row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
    },
    {
        field: 'client_name',
        headerName: 'Клиент',
        flex: 1.2,
        valueGetter: (_, row) => row.client?.name ?? '—',
    },
    {
        field: 'customer_name',
        headerName: 'Контрагент',
        flex: 1.2,
        valueGetter: (_, row) => row.customer?.name ?? '—',
    },
    { field: 'delivery_date', headerName: 'Дата доставки', flex: 1 },
    {
        field: 'delivery_window',
        headerName: 'Время доставки',
        flex: 1,
        valueGetter: (_, row) => `${row.delivery_from ?? '—'} – ${row.delivery_to ?? '—'}`,
    },
    { field: 'status', headerName: 'Статус', flex: 1 },
]
