
import django_filters
from django.db.models import Q

from order.models import Order


class OrderFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(
        field_name="delivery_date",
        lookup_expr="gte",
    )
    date_to = django_filters.DateFilter(
        field_name="delivery_date",
        lookup_expr="lte",
    )

    status = django_filters.CharFilter(
        field_name="status",
    )

    customer_id = django_filters.NumberFilter(
        field_name="customer_id",
    )

    warehouse_id = django_filters.NumberFilter(
        field_name="warehouse_id",
    )

    product_id = django_filters.NumberFilter(
        field_name="order_products__id",
        distinct=True,
    )

    no_upd = django_filters.BooleanFilter(
        method="filter_no_upd",
    )

    samples = django_filters.BooleanFilter(
        field_name="samples",
    )

    class Meta:
        model = Order
        fields = []

    def filter_no_upd(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(upd_pdf__isnull=True) | Q(upd_pdf="")
            )
        return queryset
