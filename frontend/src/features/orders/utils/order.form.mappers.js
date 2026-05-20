import dayjs from 'dayjs'

export const toTimeValue = (time) => {
    if (!time) return null
    return dayjs(`1970-01-01T${time}`)
}

export const toOrderPayload = (form) => ({
    ...form,
    client: form.client || null,
    customer: form.customer?.id ?? null,
    customer_object: form.customer_object?.id ?? null,
    warehouse: form.warehouse?.id ?? null,
    contacts: form.contacts?.map((c) => c.id) ?? [],
    delivery_from: form.delivery_from?.format('HH:mm') ?? null,
    delivery_to: form.delivery_to?.format('HH:mm') ?? null,
})

export const mapOrderToForm = (order, orderResources) => {
    const customerId = order.customer?.id ?? order.customer ?? null
    const customerObjectId = order.customer_object?.id ?? order.customer_object ?? null
    const warehouseId = order.warehouse?.id ?? order.warehouse ?? null

    const selectedCustomer =
        orderResources.customers?.find((customer) => Number(customer.id) === Number(customerId)) ?? null

    const selectedCustomerObject =
        selectedCustomer?.customer_objects?.find((obj) => Number(obj.id) === Number(customerObjectId)) ?? null

    const selectedWarehouse =
        orderResources.warehouses?.find((warehouse) => Number(warehouse.id) === Number(warehouseId)) ?? null

    const contactIds = new Set(
        (order.contacts ?? []).map((contact) => (typeof contact === 'object' ? contact.id : contact)),
    )

    const selectedContacts = selectedCustomer?.contacts?.filter((contact) => contactIds.has(contact.id)) ?? []

    return {
        id: order.id ?? '',
        status: order.status ?? 'draft',
        created_at: order.created_at ?? '',
        delivery_date: order.delivery_date ?? '',
        delivery_from: toTimeValue(order.delivery_from),
        delivery_to: toTimeValue(order.delivery_to),
        client: order.client?.id ?? order.client ?? null,
        customer: selectedCustomer,
        customer_object: selectedCustomerObject,
        warehouse: selectedWarehouse,
        contacts: selectedContacts,
        description: order.description ?? '',
        samples: order.samples ?? false,
    }
}
