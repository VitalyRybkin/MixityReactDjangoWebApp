"""Transport services directory for Additional Services requests."""

from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .catalog_validation import catalog_name_exists
from .models import TransportService


class TransportServiceCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportService
        fields = ("id", "name", "is_active")
        read_only_fields = ("id", "is_active")

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError(
                "Укажите наименование транспортной услуги."
            )
        if catalog_name_exists(
            TransportService.objects.all(),
            name,
            exclude_pk=self.instance.pk if self.instance is not None else None,
        ):
            raise serializers.ValidationError(
                "Такая транспортная услуга уже есть в справочнике."
            )
        return name


class TransportServiceListCreateAPIView(APIView):
    """List active transport services and allow authorized users to create them."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Additional Services"],
        summary="List active transport services",
        responses={200: TransportServiceCatalogSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        if not request.user.has_perm(
            "additional_services.view_additionalservicerequest"
        ):
            raise PermissionDenied()
        queryset = TransportService.objects.filter(is_active=True).order_by(
            "name", "id"
        )
        return Response(TransportServiceCatalogSerializer(queryset, many=True).data)

    @extend_schema(
        tags=["Additional Services"],
        summary="Create a transport service",
        request=TransportServiceCatalogSerializer,
        responses={201: TransportServiceCatalogSerializer},
    )
    def post(self, request: Request) -> Response:
        if not request.user.has_perm(
            "additional_services.add_additionalservicerequest"
        ):
            raise PermissionDenied()
        serializer = TransportServiceCatalogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                service = TransportService.objects.create(
                    name=serializer.validated_data["name"],
                )
        except IntegrityError:
            # A concurrent request may have inserted the same name between
            # serializer validation and the database insert.
            raise serializers.ValidationError(
                {
                    "name": ["Такая транспортная услуга уже есть в справочнике."],
                }
            )
        return Response(
            TransportServiceCatalogSerializer(service).data,
            status=status.HTTP_201_CREATED,
        )
