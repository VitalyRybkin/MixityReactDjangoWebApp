// Formats a calendar date using local components, without converting it to UTC.
const formatLocalDate = (date) => {
    const pad = (value) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Used as a lazy initializer by useFormLogic: useState(emptyForm).
// Dates are calculated each time a new order form mounts, not at module import.
export const emptyOrderForm = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    return {
        id: '',
        order_date: formatLocalDate(today),
        delivery_date: formatLocalDate(tomorrow),
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
