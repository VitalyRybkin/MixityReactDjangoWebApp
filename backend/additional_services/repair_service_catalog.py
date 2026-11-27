"""RepairService catalog entries scoped to Additional Services permissions."""

from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from repairs.models.repair_request_models import RepairService


class AdditionalRepairServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairService
        fields = ("id", "name", "is_additional")
        read_only_fields = ("id", "is_additional")

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Укажите наименование услуги.")
        if RepairService.objects.filter(is_additional=True, name__iexact=name).exists():
            raise serializers.ValidationError("Такая услуга уже есть в справочнике.")
        return name


class AdditionalRepairServiceListCreateAPIView(APIView):
    """List and add only additional specialist services, not repair services."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Additional Services"],
        summary="List additional specialist services",
        responses={200: AdditionalRepairServiceSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        if not request.user.has_perm(
            "additional_services.view_additionalservicerequest"
        ):
            raise PermissionDenied()
        services = RepairService.objects.filter(
            is_additional=True,
            is_active=True,
        ).order_by("name", "id")
        return Response(AdditionalRepairServiceSerializer(services, many=True).data)

    @extend_schema(
        tags=["Additional Services"],
        summary="Create an additional specialist service",
        request=AdditionalRepairServiceSerializer,
        responses={201: AdditionalRepairServiceSerializer},
    )
    def post(self, request: Request) -> Response:
        if not request.user.has_perm(
            "additional_services.add_additionalservicerequest"
        ):
            raise PermissionDenied()
        serializer = AdditionalRepairServiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            # All creations through this endpoint belong to Additional Services.
            service = RepairService.objects.create(
                name=serializer.validated_data["name"],
                is_additional=True,
            )
        return Response(
            AdditionalRepairServiceSerializer(service).data,
            status=status.HTTP_201_CREATED,
        )
