from typing import Final

ALL_PERMISSIONS: Final = "__all__"

SHARED_APPS: Final = {
    "contacts",
    "common",
    "core",
}

GROUP_FULL_APPS: Final = {
    "Order Manager": SHARED_APPS
    | {
        "order",
        "repairs",
        "catalog",
    },
    "Logistic Manager": SHARED_APPS
    | {
        "order",
        "catalog",
        "logistic",
        "stock",
    },
    "Accountant": SHARED_APPS
    | {
        "repairs",
        "logistic",
        "stock",
    },
}

ACCOUNTANT_ORDER_PERMISSIONS: Final = {
    "order.view_client",
    "order.view_constructionobject",
    "order.view_customer",
    "order.view_order",
    "order.view_orderdelivery",
    "order.view_orderitem",
    "order.view_packtype",
    "order.manage_order_upd",
}