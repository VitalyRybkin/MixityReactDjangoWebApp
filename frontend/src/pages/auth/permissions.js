export const PERMISSIONS = {
    orders: {
        view: 'order.view_order',
        add: 'order.add_order',
        change: 'order.change_order',
        delete: 'order.delete_order',
    },

    carriers: {
        view: 'logistic.view_carrier',
        add: 'logistic.add_carrier',
        change: 'logistic.change_carrier',
        delete: 'logistic.delete_carrier',
    },

    drivers: {
        view: 'logistic.view_driver',
        add: 'logistic.add_driver',
        change: 'logistic.change_driver',
        delete: 'logistic.delete_driver',
    },

    trucks: {
        view: 'logistic.view_truck',
        add: 'logistic.add_truck',
        change: 'logistic.change_truck',
        delete: 'logistic.delete_truck',
    },

    warehouses: {
        view: 'stock.view_warehouse',
        add: 'stock.add_warehouse',
        change: 'stock.change_warehouse',
        delete: 'stock.delete_warehouse',
    },
}

export const GROUPS = {
    ADMINS: 'Admins',
    ORDER_MANAGER: 'Order Manager',
    LOGISTIC_MANAGER: 'Logistic Manager',
    ACCOUNTANT: 'Accountant',
}
