from order.tests.factories import BaseOrganizationFactory
from repairs.models import RepairCompany


class RepairCompanyFactory(BaseOrganizationFactory):

    class Meta:
        model = RepairCompany
