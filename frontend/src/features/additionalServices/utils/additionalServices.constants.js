export const DIRECTIONS = {
    delivery: 'Доставка оборудования',
    return: 'Возврат оборудования',
    site_work: 'Работы на объекте',
}

export const PROVIDERS = {
    carrier: 'Перевозчик',
    repair_company: 'Ремонтирующая компания',
}

export const COMPOSITIONS = {
    transport_only: 'Только транспорт / спецтехника',
    specialist_only: 'Только специалист',
    both: 'Транспорт и специалист',
}

export const STATUSES = {
    open: 'Открыта',
    closed: 'Закрыта',
}

export const DIRECTION_OPTIONS = Object.entries(DIRECTIONS).map(([id, name]) => ({ id, name }))
export const PROVIDER_OPTIONS = Object.entries(PROVIDERS).map(([id, name]) => ({ id, name }))
export const COMPOSITION_OPTIONS = Object.entries(COMPOSITIONS).map(([id, name]) => ({ id, name }))
export const STATUS_OPTIONS = Object.entries(STATUSES).map(([id, name]) => ({ id, name }))

export const SERVICE_TYPES = Object.entries(DIRECTIONS).flatMap(([direction, title]) =>
    Object.entries(PROVIDERS).map(([provider, providerTitle]) => ({
        id: `${direction}_${provider}`,
        name: `${title} · ${providerTitle}`,
    })),
)

export const INITIAL_FILTERS = {
    dateFrom: '',
    dateTo: '',
    directions: [],
    providers: [],
    types: [],
    compositions: [],
    status: '',
    customerId: '',
    objectId: '',
    itemName: '',
}

export const localISODate = () => {
    const now = new Date()
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-')
}

export const emptyItem = (category) => ({
    localId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    category,
    name: '',
    quantity: '1.000',
    cost_per_unit: '0.00',
    price_per_unit: '0.00',
    is_rebillable: false,
})

export const emptyForm = () => ({
    service_date: localISODate(),
    closing_date: '',
    direction: 'site_work',
    status: 'open',
    customerId: '',
    construction_object: '',
    rental_contract: '',
    providerType: 'carrier',
    providerId: '',
    description: '',
    items: [emptyItem('transport')],
})
