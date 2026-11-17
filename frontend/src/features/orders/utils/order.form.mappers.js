import dayjs from 'dayjs'

export const toTimeValue = (time) => {
    if (!time) return null
    return dayjs(`1970-01-01T${time}`)
}

const getEntityId = (value) => (value && typeof value === 'object' ? value.id : value) ?? null

const isSameId = (a, b) => a != null && b != null && String(a) === String(b)

const areSameIdLists = (a = [], b = []) => {
    if (a.length !== b.length) return false

    const counts = new Map()

    for (const id of a) {
        const key = String(id)
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    for (const id of b) {
        const key = String(id)
        const count = counts.get(key) ?? 0

        if (!count) return false
        counts.set(key, count - 1)
    }

    return true
}

const resolveEntity = (id, options, original, label) => {
    if (id == null) return null

    return (
        options?.find((item) => isSameId(item.id, id)) ??
        (original && typeof original === 'object' ? original : { id, name: `${label} № ${id}` })
    )
}

export const toOrderPayload = (form, originalOrder = null) => {
    const payload = {
        ...form,
        client: getEntityId(form.client),
        customer: getEntityId(form.customer),
        customer_object: getEntityId(form.customer_object),
        warehouse: getEntityId(form.warehouse),
        contacts: (form.contacts ?? []).map(getEntityId).filter((id) => id != null),
        delivery_from: form.delivery_from?.format('HH:mm') ?? null,
        delivery_to: form.delivery_to?.format('HH:mm') ?? null,
    }

    if (!originalOrder) return payload

    const relationFields = ['client', 'customer', 'customer_object', 'warehouse']

    for (const field of relationFields) {
        const originalId = getEntityId(originalOrder[field])

        if (isSameId(payload[field], originalId)) {
            delete payload[field]
        }
    }

    const originalContactIds = (originalOrder.contacts ?? []).map(getEntityId).filter((id) => id != null)

    if (areSameIdLists(payload.contacts, originalContactIds)) {
        delete payload.contacts
    }

    return payload
}

export const mapOrderToForm = (order, orderResources) => {
    const customerId = getEntityId(order.customer)
    const customerObjectId = getEntityId(order.customer_object)
    const warehouseId = getEntityId(order.warehouse)

    const selectedCustomer = resolveEntity(customerId, orderResources.customers, order.customer, 'Заказчик')

    const selectedCustomerObject = resolveEntity(
        customerObjectId,
        selectedCustomer?.customer_objects,
        order.customer_object,
        'Объект',
    )

    const selectedWarehouse = resolveEntity(warehouseId, orderResources.warehouses, order.warehouse, 'Склад')

    const availableContacts = new Map(
        (selectedCustomer?.contacts ?? []).map((contact) => [String(contact.id), contact]),
    )

    const selectedContacts = (order.contacts ?? [])
        .map((contact) => {
            const id = getEntityId(contact)

            if (id == null) return null

            return (
                availableContacts.get(String(id)) ??
                (typeof contact === 'object' ? contact : { id, name: `Контакт № ${id}` })
            )
        })
        .filter(Boolean)

    return {
        id: order.id ?? '',
        status: order.status ?? 'draft',
        order_date: order.order_date ?? '',
        delivery_date: order.delivery_date ?? '',
        delivery_from: toTimeValue(order.delivery_from),
        delivery_to: toTimeValue(order.delivery_to),
        client: getEntityId(order.client),
        customer: selectedCustomer,
        customer_object: selectedCustomerObject,
        warehouse: selectedWarehouse,
        contacts: selectedContacts,
        description: order.description ?? '',
        samples: order.samples ?? false,
    }
}

const DELIVERY_RELATIONS = ['carrier', 'driver', 'truck']

const DELIVERY_DECIMALS = ['delivery_cost', 'delivery_compensation', 'demurrage']

const sameDeliveryValue = (field, current, original) => {
    if (DELIVERY_RELATIONS.includes(field)) {
        const currentId = getEntityId(current)
        const originalId = getEntityId(original)

        return (currentId == null && originalId == null) || isSameId(currentId, originalId)
    }

    if (DELIVERY_DECIMALS.includes(field)) {
        const normalize = (value) => {
            if (value == null || value === '') return null

            const number = Number(value)
            return Number.isFinite(number) ? number : value
        }

        return Object.is(normalize(current), normalize(original))
    }

    return Object.is(current, original)
}

export const toDeliveryPayload = (delivery, originalDelivery = null) => {
    if (delivery == null) return null

    const payload = {
        ...delivery,
        carrier: getEntityId(delivery.carrier),
        driver: getEntityId(delivery.driver),
        truck: getEntityId(delivery.truck),
    }

    if (originalDelivery == null) {
        return payload
    }

    for (const field of Object.keys(payload)) {
        if (!Object.hasOwn(originalDelivery, field)) continue

        if (sameDeliveryValue(field, payload[field], originalDelivery[field])) {
            delete payload[field]
        }
    }

    return Object.keys(payload).length ? payload : undefined
}
