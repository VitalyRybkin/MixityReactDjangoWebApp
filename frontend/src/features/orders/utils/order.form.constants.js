const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

export const emptyOrderForm = {
    id: '',
    delivery_date: tomorrow.toISOString().split('T')[0],
    delivery_from: null,
    delivery_to: null,
    client: null,
    customer: null,
    customer_object: null,
    warehouse: null,
    contacts: [],
    status: 'draft',
    description: '',
    samples: false,
}

export const emptyDeliveryInfo = {
    delivery_cost: '',
    delivery_compensation: '',
    demurrage: '',
    carrier: null,
    driver: null,
    truck: null,
}

export const orderStatus = {
    draft: 'Черновик',
    created: 'Создан',
    in_progress: 'В работе',
    completed: 'Завершен',
}

export const fieldsetStyles = {
    flex: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    p: 2,
    m: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2.1,
    '&:hover': {
        borderColor: 'text.secondary',
    },
}
