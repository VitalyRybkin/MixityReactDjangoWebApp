export const routes = [
    {
        path: '/',
        breadcrumb: 'Главная',
    },
    {
        path: '/carriers',
        breadcrumb: 'Перевозчики',
    },
    {
        path: '/carriers/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/carriers/:id',
        breadcrumb: 'Карточка',
    },
    {
        path: '/carriers/:id/edit',
        breadcrumb: 'Редактировать',
    },
    {
        path: '/carriers/:id/drivers',
        breadcrumb: 'Водители',
    },
    {
        path: '/carriers/:carrierId/drivers/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/carriers/:carrierId/drivers/:driverId/edit',
        breadcrumb: 'Редактировать',
    },
    {
        path: '/carriers/:id/trucks',
        breadcrumb: 'Автотранспорт',
    },
    {
        path: '/carriers/:carrierId/trucks/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/carriers/:carrierId/trucks/:truckId/edit',
        breadcrumb: 'Редактировать',
    },
    {
        path: '/warehouses',
        breadcrumb: 'Склады',
    },
    {
        path: '/warehouses/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/warehouses/:id',
        breadcrumb: 'Карточка',
    },
    {
        path: '/warehouses/:id/edit',
        breadcrumb: 'Редактировать',
    },
    {
        path: '/warehouses/:id/map',
        breadcrumb: 'Схема проезда',
    },
    {
        path: '/clients',
        breadcrumb: 'Клиенты',
    },
    {
        path: '/clients/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/clients/:id',
        breadcrumb: 'Карточка',
    },
    {
        path: '/customers',
        breadcrumb: 'Заказчики',
    },
    {
        path: '/customers/create',
        breadcrumb: 'Создать',
    },
    {
        path: '/customers/:id',
        breadcrumb: 'Карточка',
    },
]
