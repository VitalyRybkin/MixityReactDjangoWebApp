// Keep API payload and UI monetary arithmetic independent of React.
export const positiveId = (value) => {
    const id = Number(value)
    return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const relationId = (value) => {
    if (value && typeof value === 'object') return positiveId(value.id)
    return positiveId(value)
}

export const makeParams = (filters = {}, page = 1) => {
    const params = { page, page_size: 10 }
    const arrayFilters = {
        direction: filters.directions,
        provider_type: filters.providers,
        service_type: filters.types,
        composition: filters.compositions,
    }
    Object.entries(arrayFilters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) params[key] = values.join(',')
    })
    const simple = {
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        status: filters.status,
        customer_id: filters.customerId,
        object_id: filters.objectId,
        item_name: filters.itemName?.trim(),
    }
    Object.entries(simple).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) params[key] = value
    })
    return params
}

export const toForm = (request) => ({
    service_date: request.service_date || '',
    closing_date: request.closing_date || '',
    direction: request.direction || 'site_work',
    status: request.status === 'completed' ? 'closed' : (request.status === 'created' ? 'open' : (request.status || 'open')),
    customerId: String(relationId(request.customer) || ''),
    construction_object: String(relationId(request.construction_object) || ''),
    rental_contract: String(relationId(request.rental_contract) || ''),
    providerType: request.carrier != null ? 'carrier' : 'repair_company',
    providerId: String(relationId(request.carrier ?? request.repair_company) || ''),
    description: request.description || '',
    items: (request.items || []).map((row) => ({
        localId: `existing-${row.id}`,
        category: row.category,
        name: row.name,
        service: String(relationId(row.service) || ''),
        quantity: String(row.quantity),
        cost_per_unit: String(row.cost_per_unit),
        price_per_unit: String(row.price_per_unit),
        is_rebillable: Boolean(row.is_rebillable),
    })),
})

export const validateForm = (form) => {
    const errors = []
    if (!['open', 'closed'].includes(form.status)) errors.push('Выберите статус заявки.')
    if (form.status === 'closed' && !form.closing_date) errors.push('Укажите дату закрытия заявки.')
    if (form.status === 'open' && form.closing_date) errors.push('Дата закрытия допустима только при статусе «Закрыта».')
    if (!form.service_date) errors.push('Укажите дату услуги.')
    if (!form.direction) errors.push('Выберите направление.')
    if (!positiveId(form.construction_object)) errors.push('Выберите объект.')
    if (!positiveId(form.rental_contract)) errors.push('Выберите договор аренды.')
    if (!positiveId(form.providerId)) errors.push('Выберите исполнителя.')
    if (!form.items.length) errors.push('Добавьте хотя бы одну позицию.')
    if (form.providerType === 'carrier' && form.items.some((item) => item.category === 'specialist')) {
        errors.push('Перевозчик не может выполнять услуги специалиста.')
    }
    if (['delivery', 'return'].includes(form.direction) && !form.items.some((item) => item.category === 'transport')) {
        errors.push('Для доставки и возврата необходима транспортная позиция.')
    }
    form.items.forEach((item, index) => {
        if (!item.name.trim()) errors.push(`Позиция ${index + 1}: укажите наименование.`)
        if (!/^\d{1,7}(?:[.,]\d{1,3})?$/.test(item.quantity) || Number(item.quantity.replace(',', '.')) <= 0) {
            errors.push(`Позиция ${index + 1}: количество должно быть положительным (до 3 знаков).`)
        }
        for (const field of ['cost_per_unit', 'price_per_unit']) {
            if (!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(item[field])) {
                errors.push(`Позиция ${index + 1}: цена должна быть неотрицательной (до 2 знаков).`)
            }
        }
    })
    return errors
}

export const toPayload = (form, original = null) => {
    const providerId = positiveId(form.providerId)
    const payload = {
        service_date: form.service_date,
        ...(Object.prototype.hasOwnProperty.call(form, 'closing_date')
            ? { closing_date: form.closing_date || null }
            : {}),
        direction: form.direction,
        status: form.status,
        construction_object: positiveId(form.construction_object),
        rental_contract: positiveId(form.rental_contract),
        carrier: form.providerType === 'carrier' ? providerId : null,
        repair_company: form.providerType === 'repair_company' ? providerId : null,
        description: form.description,
        items: form.items.map(({ category, name, service, quantity, cost_per_unit, price_per_unit, is_rebillable }) => ({
            category,
            name: name.trim(),
            ...(category === 'specialist' && positiveId(service) ? { service: positiveId(service) } : {}),
            quantity: quantity.replace(',', '.'),
            cost_per_unit: cost_per_unit.replace(',', '.'),
            price_per_unit: price_per_unit.replace(',', '.'),
            is_rebillable,
        })),
    }
    // An unchanged specification must not be deleted and reinserted by a status-only PATCH.
    if (original) {
        if (Object.prototype.hasOwnProperty.call(payload, 'closing_date')
            && payload.closing_date === (original.closing_date || null)) {
            delete payload.closing_date
        }
        const existingItems = toForm(original).items.map(({ category, name, service, quantity, cost_per_unit, price_per_unit, is_rebillable }) => ({
            category, name: name.trim(),
            ...(category === 'specialist' && positiveId(service) ? { service: positiveId(service) } : {}),
            quantity, cost_per_unit, price_per_unit, is_rebillable,
        }))
        if (JSON.stringify(payload.items) === JSON.stringify(existingItems)) delete payload.items

        // Archived links must survive an unchanged PATCH. The existing object/contract is
        // not offered in active selectors, but it remains linked unless the user changes it.
        if (positiveId(form.construction_object) === relationId(original.construction_object)) {
            delete payload.construction_object
        }
        if (positiveId(form.rental_contract) === relationId(original.rental_contract)) {
            delete payload.rental_contract
        }
        const originalType = original.carrier != null ? 'carrier' : 'repair_company'
        const originalProviderId = relationId(original.carrier ?? original.repair_company)
        if (form.providerType === originalType && providerId === originalProviderId) {
            delete payload.carrier
            delete payload.repair_company
        }
    }
    return payload
}

// Backend rounds each quantity * unit price to cents with Decimal. Replicate it here
// with integer arithmetic: quantity has 3 dp, unit price 2 dp, half up per row.
const parseFixed = (value, places) => {
    const raw = String(value ?? '').replace(',', '.')
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return 0n
    const [whole, part = ''] = raw.split('.')
    if (part.length > places) return 0n
    return BigInt(whole) * (10n ** BigInt(places)) + BigInt(part.padEnd(places, '0') || '0')
}

export const amountInCents = (row, field) => {
    const qtyMilli = parseFixed(row.quantity, 3)
    const priceCents = parseFixed(row[field], 2)
    return (qtyMilli * priceCents + 500n) / 1000n
}

export const previewTotals = (items) => {
    const zero = () => ({ cost: 0n, charge: 0n, margin: 0n })
    const categories = { transport: zero(), specialist: zero() }
    for (const row of items) {
        if (!categories[row.category]) continue
        categories[row.category].cost += amountInCents(row, 'cost_per_unit')
        if (row.is_rebillable) categories[row.category].charge += amountInCents(row, 'price_per_unit')
    }
    const overall = zero()
    for (const entry of Object.values(categories)) {
        entry.margin = entry.charge - entry.cost
        overall.cost += entry.cost
        overall.charge += entry.charge
    }
    overall.margin = overall.charge - overall.cost
    return { ...overall, by_category: categories }
}

export const formatCents = (value) => {
    const cents = typeof value === 'bigint' ? value : BigInt(value)
    const sign = cents < 0n ? '−' : ''
    const absolute = cents < 0n ? -cents : cents
    const int = absolute / 100n
    const fraction = String(absolute % 100n).padStart(2, '0')
    const separated = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${sign}${separated},${fraction} ₽`
}
