from decimal import Decimal

from django.core.exceptions import ValidationError

from catalog.models import AppUnit, ProductUnit, QualityPassport
from catalog.tests.api.factories import QualityPassportFactory
from catalog.utils.unit_choices import TitleChoices
from core.tests.base_model_test_case import BaseModelTestCase


class TestQualityPassportModel(BaseModelTestCase):
    __test__ = True

    _model = QualityPassport
    _factory = QualityPassportFactory

    def test_valid_piece_quantity(self) -> None:
        """
        Test case for validating the quantity of pieces based on different configurations of package
        weight and quantity. This method ensures that the system correctly accepts or validates specific
        quantity values for corresponding package weights.
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
        enforcement. This method uses various test cases, where each case represents
        a combination of pack weight and quantity, and asserts that the quantity
        fails validation for the configured unit. The `full_clean` method is tested
        to confirm that it raises a `ValidationError` for incorrect values. Logging
        functions are used to log the validation and errors during the test.
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
        unit configuration rules. It ensures that only valid quantities are accepted
        and invalid ones raise validation errors as expected.
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
        a validation failure when calling the object's `full_clean` method. It
        checks if the generated validation error includes the "quantity" field
        and logs the corresponding information.
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
