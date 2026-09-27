from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from pypdf import PdfWriter
from rest_framework import status
from rest_framework.test import APITestCase

from core.security.clamav import ClamAVUnavailableError, MalwareDetectedError
from core.tests.authentication_tests import AuthenticationContractMixin
from core.tests.http_method_tests import DisallowedMethodsContractMixin
from core.tests.utils import TestLoggerMixin
from order.routes import OrderRoutes
from order.tests.factories import OrderFactory


def make_test_pdf() -> SimpleUploadedFile:
    buffer = BytesIO()

    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(buffer)

    return SimpleUploadedFile(
        name="upd.pdf",
        content=buffer.getvalue(),
        content_type="application/pdf",
    )


class TestOrderUpdUploadAPIView(
    DisallowedMethodsContractMixin,
    APITestCase,
    AuthenticationContractMixin,
    TestLoggerMixin,
):
    """
    Tests the OrderUpdUploadAPIView view.
    """

    disallowed_methods = (
        "get",
        "put",
        "delete",
    )
    authentication_method = "patch"

    def setUp(self) -> None:
        super().setUp()

        user_model = get_user_model()

        self.user = user_model.objects.create_superuser(
            username="test_upd_admin",
            email="test_upd_admin@example.com",
            password="test_password",
        )

        self.client.force_authenticate(user=self.user)

        self.order = OrderFactory.create()

        self.url = reverse(
            f"order_orders:{OrderRoutes.UPLOAD_UPD.name}",
            kwargs={"pk": self.order.pk},
        )

        self.temp_media = TemporaryDirectory()
        self.override_media = override_settings(
            MEDIA_ROOT=self.temp_media.name,
        )
        self.override_media.enable()

    def tearDown(self) -> None:
        self.override_media.disable()
        self.temp_media.cleanup()

        super().tearDown()

    def test_disallowed_methods_return_405(self) -> None:
        """
        Tests that disallowed methods return a 405 Method Not Allowed status.
        """
        self._disallowed_methods_logic()

    def test_upload_valid_pdf(self) -> None:
        """
        Tests that uploading a valid PDF using a randomized server-side filename
        returns a 200 OK status.
        """
        self._logger_header("PDF VALIDATION: Upload a valid PDF file.")

        original_filename = "secret_customer_invoice_123.pdf"

        file = make_test_pdf()
        file.name = original_filename

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertTrue(self.order.upd_pdf)

        stored_name = self.order.upd_pdf.name
        parts = stored_name.split("/")

        self.assertEqual(parts[0], "docs")
        self.assertEqual(parts[1], "upd")
        self.assertEqual(len(parts[2]), 4)
        self.assertTrue(parts[2].isdigit())

        stored_filename = parts[3]
        stem, extension = stored_filename.rsplit(".", 1)

        self.assertEqual(extension, "pdf")
        self.assertEqual(len(stem), 32)

        # UUID hex must contain only hexadecimal characters.
        int(stem, 16)

        # Original user-controlled filename must not reach storage.
        self.assertNotIn(original_filename, stored_name)
        self.assertNotIn("secret_customer_invoice_123", stored_name)

        self.assertTrue(self.order.upd_pdf.storage.exists(stored_name))

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ PDF stored with randomized UUID filename"
            f"{self.COLOR['END']}"
        )

    def test_upload_fake_pdf_returns_400(self) -> None:
        """Upload a fake PDF file."""
        self._logger_header("PDF VALIDATION:  Upload a fake PDF file.")

        file = SimpleUploadedFile(
            name="fake.pdf",
            content=b"This is definitely not a PDF",
            content_type="application/pdf",
        )

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

        self.assertIn("errors", response.data)
        self.assertIn("upd_pdf", response.data["errors"])

        self.order.refresh_from_db()
        self.assertFalse(self.order.upd_pdf)

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Fake PDF rejected | HTTP 400"
            f"{self.COLOR['END']}"
        )

    def test_delete_upd_pdf(self) -> None:
        """Delete the uploaded PDF file."""
        self._logger_header("PDF VALIDATION:  Delete the uploaded PDF file.")

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        old_file_name = self.order.upd_pdf.name
        storage = self.order.upd_pdf.storage

        self.assertTrue(storage.exists(old_file_name))

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                self.url,
                {"upd_pdf": None},
                format="json",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)
        self.assertFalse(storage.exists(old_file_name))
        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ PDF deleted successfully.{self.COLOR['END']}"
        )

    def test_replace_upd_pdf_deletes_old_file(self) -> None:
        """Replace the uploaded PDF file and delete the old file."""
        self._logger_header(
            "PDF VALIDATION:  Replace the uploaded PDF file and delete the old file."
        )

        old_file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": old_file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        old_file_name = self.order.upd_pdf.name
        storage = self.order.upd_pdf.storage

        self.assertTrue(storage.exists(old_file_name))

        new_file = make_test_pdf()
        new_file.name = "new_upd.pdf"

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                self.url,
                {"upd_pdf": new_file},
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        new_file_name = self.order.upd_pdf.name

        self.assertNotEqual(old_file_name, new_file_name)
        self.assertFalse(storage.exists(old_file_name))
        self.assertTrue(storage.exists(new_file_name))

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Upload allowed with change_order permission | HTTP 200"
            f"{self.COLOR['END']}"
        )

    @patch("order.validators.upd_pdf.scan_file_for_malware")
    def test_upload_pdf_with_malware_returns_400(
        self,
        mock_scan: MagicMock,
    ) -> None:
        """Upload a PDF file with malware."""
        self._logger_header("PDF VALIDATION:  Upload a PDF file with malware.")

        mock_scan.side_effect = MalwareDetectedError("Eicar-Test-Signature FOUND")

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )

        self.assertIn("errors", response.data)
        self.assertIn("upd_pdf", response.data["errors"])

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

        mock_scan.assert_called_once()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ PDF with malware rejected | HTTP 400"
            f"{self.COLOR['END']}"
        )

    @patch("order.validators.upd_pdf.scan_file_for_malware")
    def test_upload_pdf_when_clamav_unavailable_returns_503(
        self,
        mock_scan: MagicMock,
    ) -> None:
        """Upload a PDF file when ClamAV is unavailable."""
        self._logger_header(
            "PDF VALIDATION:  Upload a PDF file when ClamAV is unavailable."
        )

        mock_scan.side_effect = ClamAVUnavailableError("ClamAV недоступен.")

        file = make_test_pdf()

        with (
            self.assertLogs("core.api.exceptions", level="ERROR"),
            self.assertLogs("django.request", level="ERROR"),
        ):
            response = self.client.patch(
                self.url,
                {"upd_pdf": file},
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

        mock_scan.assert_called_once()

        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ Antivirus unavailable handled correctly | HTTP 503{self.COLOR['END']}"
        )

    def test_upload_without_change_order_permission_returns_403(self) -> None:
        """Upload a PDF file without change order permission."""
        self._logger_header(
            "PDF VALIDATION:  Upload a PDF file without change order permission."
        )

        user_model = get_user_model()

        user = user_model.objects.create_user(
            username="test_upd_no_permission",
            password="test_password",
        )

        self.client.force_authenticate(user=user)

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertFalse(self.order.upd_pdf)

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Upload denied without change_order permission | HTTP 403"
            f"{self.COLOR['END']}"
        )

    def test_upload_with_change_order_permission_returns_200(self) -> None:
        """
        Upload a PDF file with change order permission.
        """
        self._logger_header(
            "PDF VALIDATION:  Upload a PDF file with change order permission."
        )
        user_model = get_user_model()

        user = user_model.objects.create_user(
            username="test_upd_change_permission",
            password="test_password",
        )

        permission = Permission.objects.get(
            content_type__app_label="order",
            codename="change_order",
        )
        user.user_permissions.add(permission)

        self.client.force_authenticate(user=user)

        file = make_test_pdf()

        response = self.client.patch(
            self.url,
            {"upd_pdf": file},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

        self.order.refresh_from_db()

        self.assertTrue(self.order.upd_pdf)
        print(
            f"{self.INDENT}{self.COLOR['OK']}✓ PDF replaced successfully.{self.COLOR['END']}"
        )
