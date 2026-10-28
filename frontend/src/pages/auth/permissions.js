export const PERMISSIONS = {
    orders: {
        view: 'order.view_order',
        add: 'order.add_order',
        change: 'order.change_order',
        delete: 'order.delete_order',
        export: 'order.export_order',
        manageUpd: 'order.manage_order_upd',
    },

    clients: {
        view: 'order.view_client',
        add: 'order.add_client',
        change: 'order.change_client',
        delete: 'order.delete_client',
    },

    customers: {
        view: 'order.view_customer',
        add: 'order.add_customer',
        change: 'order.change_customer',
        delete: 'order.delete_customer',
    },

    constructionObjects: {
        view: 'order.view_constructionobject',
        add: 'order.add_constructionobject',
        change: 'order.change_constructionobject',
        delete: 'order.delete_constructionobject',
    },

    repairRequests: {
        view: 'repairs.view_repairrequest',
        add: 'repairs.add_repairrequest',
        change: 'repairs.change_repairrequest',
        delete: 'repairs.delete_repairrequest',
        export: 'repairs.export_repairrequest',
        printClaim: 'repairs.print_repairrequest_claim',
    },

    repairCompanies: {
        view: 'repairs.view_repaircompany',
        add: 'repairs.add_repaircompany',
        change: 'repairs.change_repaircompany',
        delete: 'repairs.delete_repaircompany',
    },

    catalog: {
        view: 'catalog.view_product',
        add: 'catalog.add_product',
        change: 'catalog.change_product',
        delete: 'catalog.delete_product',
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
