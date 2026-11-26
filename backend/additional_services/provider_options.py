"""Restricted ID/name references for creating additional service requests.

No rights to the Carrier or RepairCompany CRUD API are granted to users.
"""

from django.db.models import QuerySet
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from logistic.models import Carrier
from repairs.models import RepairCompany


class ProviderOptionSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class AdditionalServiceProviderOptionsAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        tags=["Additional Services"],
        operation_id="listAdditionalServiceProviderOptions",
        parameters=[
            OpenApiParameter(
                name="type",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                enum=["carrier", "repair_company"],
            ),
        ],
        responses={200: ProviderOptionSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        user = request.user
        if not (
            user.has_perm("additional_services.view_additionalservicerequest")
            or user.has_perm("additional_services.add_additionalservicerequest")
        ):
            raise PermissionDenied("Нет доступа к дополнительным услугам.")

        provider_type = request.query_params.get("type")
        qs: QuerySet[Carrier] | QuerySet[RepairCompany]
        if provider_type == "carrier":
            qs = Carrier.objects.all()
        elif provider_type == "repair_company":
            qs = RepairCompany.objects.active()
        else:
            raise ValidationError({"type": "Выберите carrier или repair_company."})

        return Response(list(qs.order_by("name", "pk").values("id", "name")))
