from django.db.models import QuerySet
from rest_framework import generics
from rest_framework.generics import get_object_or_404

from contacts.models import Contact
from contacts.selectors import ContactSelector
from contacts.serializers import ContactSerializer
from core.openapi.base_views import (
    BaseListAPIView,
    BaseListCreateAPIView,
    BaseRetrieveUpdateDestroyAPIView,
)
from core.tests.visibility_tests import SoftDeleteContractMixin
from repairs.models import RepairCompany
from repairs.serializers.repair_company_serializers import RepairCompanySerializer


class BaseRepairCompanyGenericAPIView(generics.GenericAPIView):
    queryset = RepairCompany.objects.all()
    serializer_class = RepairCompanySerializer


class RepairCompanyListCreateAPIView(
    BaseListCreateAPIView, BaseRepairCompanyGenericAPIView
):
    """
    List and create repair companies.
    """

    resource_name = "RepairCompany"
    schema_tags = ["RepairCompany"]
    read_serializer_class = RepairCompanySerializer
    write_serializer_class = RepairCompanySerializer


class RepairCompanyRetrieveUpdateDestroyAPIView(
    SoftDeleteContractMixin,
    BaseRetrieveUpdateDestroyAPIView,
    BaseRepairCompanyGenericAPIView,
):
    """
    Retrieve, update and destroy repair companies.
    """

    resource_name = "RepairCompany"
    schema_tags = ["RepairCompany"]
    read_serializer_class = RepairCompanySerializer
    write_serializer_class = RepairCompanySerializer

    serializer_class = RepairCompanySerializer


class RepairCompanyContactListCreateAPIView(BaseListAPIView):
    """
    List and create repair company contacts.
    """

    resource_name = "RepairCompanyContact"
    schema_tags = ["RepairCompany"]
    read_serializer_class = ContactSerializer

    serializer_class = ContactSerializer

    def get_queryset(self) -> QuerySet[Contact]:
        repair_company = get_object_or_404(
            RepairCompany,
            pk=self.kwargs["pk"],
        )

        return ContactSelector.by_repair_company(repair_company.id)
