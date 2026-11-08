from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict

from django.core.exceptions import ValidationError

from catalog.api.routes import QualityPassportRoutes
from catalog.models import AppUnit, ProductUnit, QualityPassport
from catalog.serializers.passport_serializers import (
    QualityPassportReadSerializer,
    QualityPassportWriteSerializer,
)
from catalog.services.quality_passport_issue import (
    PassportChanged,
    QualityPassportIssueService,
)
from catalog.tests.api.factories import QualityPassportFactory
from catalog.utils.unit_choices import TitleChoices
from catalog.views.quality_passport_views import (
    QualityPassportRetrieveUpdateDestroyAPIView,
)
from core.tests.base_model_test_case import BaseModelTestCase
from core.tests.base_test_case import BaseAPIMixin
from core.tests.base_view_test_case import BaseQuerysetTestCase, BaseViewTestCase
from core.tests.serializer_tests import SerializerSelectionContractMixin
from core.tests.utils import FieldSpec


class TestQualityPassportModel(BaseModelTestCase):
    """
    Test validation behavior for quality passport model instances.

    Provides a database-backed test case for verifying quality passport data
    integrity, persistence behavior, and model-level validation rules.
    """

    __test__ = True

    _model = QualityPassport
    _factory = QualityPassportFactory

    def _make_passport(self, issue_date: date) -> QualityPassport:
        """
        Creates a new quality passport instance with the specified issue date.
        """
        return QualityPassport(
            product=self.obj.product,
            number=f"{self.obj.number}-NEW",
            issue_date=issue_date,
            production_date=self.obj.production_date,
            batch_number=self.obj.batch_number,
            quantity=self.obj.quantity,
        )

    def test_valid_piece_quantity(self) -> None:
        """
        Test case for validating the quantity of pieces based on different configurations of package
        weight and quantity.
        """
        self._logger_header("VALIDATION: Valid piece quantity")

        test_cases = [
            (15, Decimal("15.000")),
            (20, Decimal("20.000")),
            (25, Decimal("25.000")),
            (30, Decimal("30.000")),
            (15, Decimal("15.015")),
            (25, Decimal("10.025")),
            (30, Decimal("10.050")),
        ]

        config = self.obj.product.unit_config

        for pack_weight, quantity in test_cases:
            with self.subTest(pack_weight=pack_weight, quantity=quantity):
                config.value = pack_weight
                config.save()

                self.obj.quantity = quantity
                self.obj.full_clean()

                self._logger_success(
                    "quantity",
                    f"Accepted {quantity} t for {pack_weight} kg bags",
                )

    def test_invalid_piece_quantity(self) -> None:
        """
        Validates scenarios with invalid piece quantities to ensure proper constraint
        enforcement.
        """
        self._logger_header("VALIDATION: Invalid piece quantity")

        test_cases = [
            (15, Decimal("10.001")),
            (20, Decimal("10.015")),
            (25, Decimal("10.030")),
            (30, Decimal("10.025")),
        ]

        config = self.obj.product.unit_config

        for pack_weight, quantity in test_cases:
            with self.subTest(pack_weight=pack_weight, quantity=quantity):
                config.value = pack_weight
                config.save()

                self.obj.quantity = quantity

                with self.assertRaises(ValidationError) as exc:
                    self.obj.full_clean()

                self.assertIn(
                    "quantity",
                    exc.exception.message_dict,
                )

                self._logger_error(
                    "quantity",
                    f"Rejected {quantity} t for {pack_weight} kg bags",
                )

    def test_bulk_quantity(self) -> None:
        """
        Validates if the quantity of the bulk product meets the specified
        unit configuration rules.
        """
        self._logger_header("VALIDATION: Bulk product quantity")

        config = self.obj.product.unit_config

        ton_unit, _ = AppUnit.objects.get_or_create(
            title=TitleChoices.TON,
            defaults={
                "is_weight_based": True,
                "to_kg_factor": 1000,
            },
        )

        config.unit = ton_unit
        config.value = 1
        config.save()

        test_cases = [
            (Decimal("10.000"), True),
            (Decimal("10.100"), True),
            (Decimal("10.200"), True),
            (Decimal("10.050"), False),
            (Decimal("10.125"), False),
        ]

        for quantity, is_valid in test_cases:
            with self.subTest(quantity=quantity, is_valid=is_valid):
                self.obj.quantity = quantity

                if is_valid:
                    self.obj.full_clean()

                    self._logger_success(
                        "quantity",
                        f"Accepted bulk quantity {quantity} t",
                    )
                else:
                    with self.assertRaises(ValidationError) as exc:
                        self.obj.full_clean()

                    self.assertIn(
                        "quantity",
                        exc.exception.message_dict,
                    )

                    self._logger_error(
                        "quantity",
                        f"Rejected bulk quantity {quantity} t",
                    )

    def test_product_without_unit_config(self) -> None:
        """
        Ensures that a product without an associated unit configuration cannot
        be validated and raises an expected `ValidationError`.
        """
        self._logger_header("VALIDATION: Missing ProductUnit")

        product = self.obj.product

        product.unit_config.delete()
        product.refresh_from_db()

        self.assertFalse(ProductUnit.objects.filter(product=product).exists())

        with self.assertRaises(ValidationError) as exc:
            self.obj.full_clean()

        self.assertIn("product", exc.exception.message_dict)

        self._logger_error(
            "product",
            "Rejected product without unit configuration",
        )

    def test_duplicate_passport_number(self) -> None:
        """
        Ensures that a product with a duplicate passport number cannot
        be validated and raises an expected `ValidationError`.
        """
        self._logger_header("VALIDATION: Duplicate passport number")

        passport = QualityPassport(
            product=self.obj.product,
            number=self.obj.number,
            issue_date=self.obj.issue_date,
            production_date=self.obj.production_date,
            batch_number=self.obj.batch_number,
            quantity=self.obj.quantity,
        )

        with self.assertRaises(ValidationError) as exc:
            passport.full_clean()

        self.assertIn("number", exc.exception.message_dict)

        self._logger_error(
            "number",
            f"Rejected duplicate passport number {self.obj.number}",
        )

    def test_save_validates_quantity(self) -> None:
        """
        Ensures that when an invalid `quantity` is assigned to an object and the
        `save` method is called, a `ValidationError` is raised, and the original value
        in the database remains unchanged.
        """
        self._logger_header("VALIDATION: Save validates quantity")

        original_quantity = self.obj.quantity
        self.obj.quantity = Decimal("10.001")

        with self.assertRaises(ValidationError) as exc:
            self.obj.save()

        self.assertIn("quantity", exc.exception.message_dict)

        self.obj.refresh_from_db()
        assert self.obj.quantity == original_quantity

        self._logger_success(
            "save",
            "Invalid quantity rejected; database value unchanged",
        )

    def test_zero_quantity(self) -> None:
        """
        Ensures that setting the quantity attribute to zero leads to
        a validation failure when calling the object's `full_clean` method.
        """
        self._logger_header("VALIDATION: Zero quantity")

        self.obj.quantity = Decimal("0.000")

        with self.assertRaises(ValidationError) as exc:
            self.obj.full_clean()

        self.assertIn("quantity", exc.exception.message_dict)

        self._logger_error(
            "quantity",
            "Rejected zero quantity",
        )

    def test_multiple_passports_for_same_product(self) -> None:
        """
        Validate that multiple quality passports can be associated with the same product.
        """
        self._logger_header("VALIDATION: Multiple passports per product")

        passport = QualityPassport(
            product=self.obj.product,
            number=f"{self.obj.number}-NEW",
            issue_date=self.obj.issue_date,
            production_date=self.obj.production_date,
            batch_number=self.obj.batch_number,
            quantity=self.obj.quantity,
        )

        passport.full_clean()
        passport.save()

        self.assertEqual(
            QualityPassport.objects.filter(
                product=self.obj.product,
            ).count(),
            2,
        )

        self._logger_success(
            "product",
            "Multiple passports for the same product accepted",
        )

    def test_new_passport_cannot_have_earlier_issue_date(self) -> None:
        """
        Validate that a new passport is rejected when its issue date is earlier than the
        existing passport issue date.
        """
        self._logger_header("PASSPORT: EARLIER ISSUE DATE")

        passport = self._make_passport(self.obj.issue_date - timedelta(days=1))

        with self.assertRaises(ValidationError) as exc:
            passport.full_clean()

        self.assertIn("issue_date", exc.exception.message_dict)

        self._logger_success(
            "issue_date",
            "Earlier issue date rejected",
        )

    def test_new_passport_with_same_date_becomes_latest(self) -> None:
        """
        Validate that a newly saved passport with the same issue date as an existing
        passport is treated as the latest issued passport for the product. Confirms
        that equal issue dates are accepted and that the newest persisted record is
        selected when issue dates match.
        """
        self._logger_header("PASSPORT: SAME ISSUE DATE")

        passport = self._make_passport(self.obj.issue_date)
        passport.save()

        latest = QualityPassport.last_issued.get_latest_for_product(self.obj.product)

        self.assertIsNotNone(latest)
        self.assertIsNotNone(latest)
        assert latest is not None

        self.assertEqual(latest.pk, passport.pk)

        self._logger_success(
            "issue_date",
            "Same date allowed; higher ID becomes latest",
        )

    def test_new_passport_with_later_date(self) -> None:
        """
        Verify that a passport with a later issue date is selected as the latest.
        """
        self._logger_header("PASSPORT: LATER ISSUE DATE")

        passport = self._make_passport(self.obj.issue_date + timedelta(days=1))
        passport.save()

        latest = QualityPassport.last_issued.get_latest_for_product(self.obj.product)

        self.assertIsNotNone(latest)
        assert latest is not None

        self.assertEqual(latest.pk, passport.pk)

        self._logger_success(
            "issue_date",
            "Later issue date accepted",
        )

    def test_issue_new_passport_keeps_previous_unchanged(self) -> None:
        self._logger_header("PASSPORT: AUTOMATIC ISSUE")

        old_passport = self.obj

        new_passport = QualityPassportIssueService.issue(
            product_id=old_passport.product_id,
            expected_latest_passport_id=old_passport.pk,
            number=f"{old_passport.number}-NEW",
            batch_number=old_passport.batch_number,
            production_date=old_passport.production_date,
            quantity=old_passport.quantity,
        )

        latest = QualityPassport.last_issued.get_latest_for_product(
            old_passport.product
        )

        old_passport.refresh_from_db()

        self.assertNotEqual(new_passport.pk, old_passport.pk)
        assert latest is not None
        self.assertEqual(latest.pk, new_passport.pk)
        self.assertEqual(old_passport.number, self.obj.number)

        self._logger_success(
            "quality_passport",
            "New passport issued; previous passport preserved",
        )

    def test_issue_rejects_stale_latest_passport(self) -> None:
        self._logger_header("PASSPORT: STALE ISSUE REQUEST")

        count_before = QualityPassport.objects.count()

        with self.assertRaises(PassportChanged):
            QualityPassportIssueService.issue(
                product_id=self.obj.product_id,
                expected_latest_passport_id=None,
                number=f"{self.obj.number}-NEW",
                batch_number=self.obj.batch_number,
                production_date=self.obj.production_date,
                quantity=self.obj.quantity,
            )

        self.assertEqual(
            QualityPassport.objects.count(),
            count_before,
        )

        self._logger_success(
            "quality_passport",
            "Stale issue rejected; no passport created",
        )


class TestQualityPassportView(SerializerSelectionContractMixin, BaseViewTestCase):
    """
    Validate serializer selection for the quality passport detail view test case.

    Provides a test case that checks whether the quality passport detail API view
    selects the expected serializers for the supported request methods. This class
    is intended to participate in the view test suite and focuses on confirming
    serializer configuration consistency for retrieve and modification operations.
    """

    __test__ = True

    _view_class = QualityPassportRetrieveUpdateDestroyAPIView
    _cases = [
        ("GET", QualityPassportReadSerializer),
        ("PUT", QualityPassportWriteSerializer),
        ("PATCH", QualityPassportWriteSerializer),
    ]

    def test_serializer_classes(self) -> None:
        """
        Tests that the GET, PUT, PATCH, and DELETE methods use the expected serializers.
        """
        self._logger_header("SERIALIZERS: QUALITY PASSPORT DETAIL")
        self._serializer_classes_logic()
        self._logger_success(
            "serializers",
            "GET / PUT / PATCH use expected serializers",
        )


class TestQualityPassportDetailQueryset(BaseQuerysetTestCase):
    """
    Validate queryset behavior for the quality passport detail API test case.

    Ensures that quality passport detail queries satisfy the expected queryset
    contract for the associated API view. The test case focuses on public queryset
    behavior and verifies that required related objects are selected efficiently for
    detail operations.
    """

    __test__ = True
    _factory = QualityPassportFactory
    _view_class = QualityPassportRetrieveUpdateDestroyAPIView

    def test_queryset_contract(self) -> None:
        """
        Validate that the product queryset satisfies the expected contract.
        """
        """"""
        self._factory.create_batch(3)

        self._assert_queryset_contract(
            expected_selects=["product", "created_by"],
        )


class TestQualityPassportAPI(BaseAPIMixin):
    """
    Test API behavior for quality passport creation and validation.

    Provides integration-style coverage for quality passport creation through the
    configured API endpoint. The test case validates successful object creation,
    unique-field enforcement, mandatory-field enforcement, string conversion
    behavior, and request payload construction for quality passport data.
    """

    __test__ = True
    model = QualityPassport
    factory = QualityPassportFactory
    check_get_permissions = False

    serializer_class = QualityPassportWriteSerializer

    fields_map = {
        "id": FieldSpec("id", int),
        "product": FieldSpec("product", dict, required=True),
        "number": FieldSpec("number", str, required=True, unique=True),
        "issue_date": FieldSpec("issue_date", str, required=False),
        "batch_number": FieldSpec("batch_number", str, required=True),
        "production_date": FieldSpec("production_date", str, required=True),
        "quantity": FieldSpec("quantity", str, required=True),
        "created_at": FieldSpec("created_at", str),
        "updated_at": FieldSpec("updated_at", str),
    }

    url_name = f"catalog:{QualityPassportRoutes.CREATE.name}"

    def test_creating_item_logic(self) -> None:
        """Test the logic for creating a new passport."""
        payload = self.payload_generator()
        self._create_logic(payload)

    def test_item_unique_fields(self) -> None:
        """Test the logic for ensuring unique fields in passport creation."""
        payload = self.payload_generator()
        self._test_all_unique_fields(payload)

    def test_item_mandatory_fields(self) -> None:
        """Test the logic for ensuring mandatory fields in passport creation."""
        payload = self.payload_generator()
        self._test_all_mandatory_fields(payload)

    def test_str_method(self) -> None:
        """Test the string representation of a passport."""
        passport = self.obj
        self._str_method_logic(f"Паспорт № {passport.number} — {passport.product.name}")

    def payload_generator(self) -> Dict[str, Any]:
        """Generate a payload for quality passport creation tests."""
        passport = self.obj

        return {
            "product": passport.product_id,
            "number": f"{passport.number}-NEW",
            "issue_date": passport.issue_date.isoformat(),
            "batch_number": passport.batch_number,
            "production_date": passport.production_date.isoformat(),
            "quantity": str(passport.quantity),
        }
