from django.apps import apps


def order_status_choices():
    model = apps.get_model("order", "Order")
    return model._meta.get_field("status").choices


def repair_status_choices():
    model = apps.get_model("repairs", "RepairRequest")
    return model._meta.get_field("status").choices