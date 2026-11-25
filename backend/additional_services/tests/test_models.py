"""Test database constraints on additional service requests."""

from django.db import IntegrityError, transaction
from django.test import TestCase

from additional_services.models import AdditionalServiceRequest
from core.tests.utils import TestLoggerMixin
from order.tests.factories import ConstructionObjectFactory


class TestAdditionalServiceRequestModel(TestCase, TestLoggerMixin):
    """Exercise constraints enforced when saving a service request."""

    def test_database_rejects_missing_provider(self) -> None:
        """Enforce the provider constraint at the database level."""
        self._logger_header("MODEL: AdditionalServiceRequest provider constraint")
        construction_object = ConstructionObjectFactory.create()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                AdditionalServiceRequest.objects.create(
                    direction="site_work",
                    construction_object=construction_object,
                    carrier=None,
                    repair_company=None,
                )
        self._logger_success("Request without a provider rejected", "IntegrityError")
