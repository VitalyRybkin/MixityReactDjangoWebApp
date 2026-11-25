"""Composable REST filters: direction, provider, exact type and item composition."""

from datetime import date

from django.db.models import Exists, OuterRef, Q, QuerySet
from django.http import QueryDict
from rest_framework.exceptions import ValidationError

from .models import AdditionalServiceItem, AdditionalServiceRequest

DIRECTIONS = set(AdditionalServiceRequest.Direction.values)
PROVIDERS = {"carrier", "repair_company"}
COMPOSITIONS = {"transport_only", "specialist_only", "both"}
SERVICE_TYPES = {
    f"{direction}_{provider}" for direction in DIRECTIONS for provider in PROVIDERS
}


def _values(params: QueryDict, name: str, allowed: set[str]) -> list[str]:
    """Support repeated query parameters and comma-separated values."""
    result = []
    for raw in params.getlist(name):
        result.extend(part.strip() for part in raw.split(",") if part.strip())
    invalid = set(result) - allowed
    if invalid:
        raise ValidationError(
            {name: f'Неизвестные значения: {", ".join(sorted(invalid))}.'}
        )
    return result


def filter_additional_services(
    queryset: QuerySet[AdditionalServiceRequest], params: QueryDict
) -> QuerySet[AdditionalServiceRequest]:
    """Apply validated request and specification filters to the queryset."""
    transport = AdditionalServiceItem.objects.filter(
        request_id=OuterRef("pk"), category="transport"
    )
    specialist = AdditionalServiceItem.objects.filter(
        request_id=OuterRef("pk"), category="specialist"
    )
    queryset = queryset.annotate(
        has_transport=Exists(transport), has_specialist=Exists(specialist)
    )

    directions = _values(params, "direction", DIRECTIONS)
    providers = _values(params, "provider_type", PROVIDERS)
    service_types = _values(params, "service_type", SERVICE_TYPES)
    compositions = _values(params, "composition", COMPOSITIONS)

    if directions:
        queryset = queryset.filter(direction__in=directions)
    if providers:
        provider_query = Q()
        if "carrier" in providers:
            provider_query |= Q(carrier__isnull=False)
        if "repair_company" in providers:
            provider_query |= Q(repair_company__isnull=False)
        queryset = queryset.filter(provider_query)
    if service_types:
        type_query = Q()
        for service_type in service_types:
            for provider in PROVIDERS:
                suffix = f"_{provider}"
                if service_type.endswith(suffix):
                    direction = service_type[: -len(suffix)]
                    type_query |= Q(
                        **{
                            "direction": direction,
                            f'{"carrier" if provider == "carrier" else "repair_company"}__isnull': False,
                        }
                    )
                    break
        queryset = queryset.filter(type_query)
    if compositions:
        comp_query = Q()
        if "transport_only" in compositions:
            comp_query |= Q(has_transport=True, has_specialist=False)
        if "specialist_only" in compositions:
            comp_query |= Q(has_transport=False, has_specialist=True)
        if "both" in compositions:
            comp_query |= Q(has_transport=True, has_specialist=True)
        queryset = queryset.filter(comp_query)

    if category := params.get("item_category"):
        if category not in {"transport", "specialist"}:
            raise ValidationError(
                {"item_category": "Неизвестная категория спецификации."}
            )
        queryset = queryset.filter(
            **{"has_transport" if category == "transport" else "has_specialist": True}
        )
    if value := params.get("item_name"):
        if value.strip():
            matching = AdditionalServiceItem.objects.filter(
                request_id=OuterRef("pk"),
                name__icontains=value.strip(),
            )
            queryset = queryset.filter(Exists(matching))
    if value := params.get("customer_id"):
        queryset = queryset.filter(
            construction_object__customer_id=_positive_id(value, "customer_id")
        )
    if value := params.get("object_id"):
        queryset = queryset.filter(
            construction_object_id=_positive_id(value, "object_id")
        )
    if value := params.get("rental_contract_id"):
        queryset = queryset.filter(
            rental_contract_id=_positive_id(value, "rental_contract_id")
        )
    if value := params.get("carrier_id"):
        queryset = queryset.filter(carrier_id=_positive_id(value, "carrier_id"))
    if value := params.get("repair_company_id"):
        queryset = queryset.filter(
            repair_company_id=_positive_id(value, "repair_company_id")
        )
    if value := params.get("status"):
        if value not in AdditionalServiceRequest.Status.values:
            raise ValidationError({"status": "Неизвестный статус."})
        queryset = queryset.filter(status=value)
    if value := params.get("date_from"):
        queryset = queryset.filter(service_date__gte=_date(value, "date_from"))
    if value := params.get("date_to"):
        queryset = queryset.filter(service_date__lte=_date(value, "date_to"))
    return queryset


def _positive_id(raw: str, name: str) -> int:
    """Parse a positive record ID from a filter value."""
    try:
        result = int(raw)
    except (TypeError, ValueError):
        raise ValidationError(
            {name: "ID должен быть положительным целым числом."}
        ) from None
    if result < 1:
        raise ValidationError({name: "ID должен быть положительным целым числом."})
    return result


def _date(raw: str, name: str) -> date:
    """Parse an ISO service date from a filter value."""
    try:
        return date.fromisoformat(raw)
    except ValueError:
        raise ValidationError({name: "Используйте формат YYYY-MM-DD."}) from None
