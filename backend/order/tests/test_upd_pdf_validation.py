from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from pypdf import PdfWriter

from core.tests.utils import TestLoggerMixin
from order.serializers.order_serializers.create_order_serializers import (
    MAX_UPD_PDF_SIZE,
)
from order.serializers.order_serializers.order_upd import OrderUpdSerializer


def make_pdf(*, encrypted: bool = False) -> bytes:
    buffer = BytesIO()

    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)

    if encrypted:
        writer.encrypt("secret")

    writer.write(buffer)

    return buffer.getvalue()


def make_uploaded_file(
    content: bytes,
    name: str = "upd.pdf",
) -> SimpleUploadedFile:
    return SimpleUploadedFile(
        name=name,
        content=content,
        content_type="application/pdf",
    )


@pytest.mark.django_db
class TestUpdPdfValidation(TestLoggerMixin):
    def test_valid_pdf(self) -> None:
        self._logger_header("VALIDATION UPD PDF: valid PDF")
        file = make_uploaded_file(make_pdf())

        serializer = OrderUpdSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["upd_pdf"] is not None

        self._logger_success("Verified", "Valid PDF accepted")

    def test_fake_pdf_rejected(self) -> None:
        self._logger_header("VALIDATION UPD PDF: fake PDF")
        file = make_uploaded_file(
            b"This is not a PDF file",
        )

        serializer = OrderUpdSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

        self._logger_success("Verified", "Fake PDF rejected")

    def test_broken_pdf_rejected(self) -> None:
        self._logger_header("VALIDATION UPD PDF: broken PDF")
        file = make_uploaded_file(
            b"%PDF-1.7\nbroken pdf content",
        )

        serializer = OrderUpdSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

        self._logger_success("Verified", "Broken PDF rejected")

    def test_oversized_pdf_rejected(self) -> None:
        self._logger_header("VALIDATION UPD PDF: oversized PDF")
        content = b"%PDF-1.7\n" + b"x" * (MAX_UPD_PDF_SIZE + 1)

        file = make_uploaded_file(content)

        serializer = OrderUpdSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

        self._logger_success("Verified", "Oversized PDF rejected")

    def test_encrypted_pdf_rejected(self) -> None:
        self._logger_header("VALIDATION UPD PDF: encrypted PDF")
        file = make_uploaded_file(
            make_pdf(encrypted=True),
        )

        serializer = OrderUpdSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

        self._logger_success("Verified", "Encrypted PDF rejected")

    def test_null_is_allowed(self) -> None:
        self._logger_header("VALIDATION UPD PDF: null is allowed")
        serializer = OrderUpdSerializer(
            data={"upd_pdf": None},
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["upd_pdf"] is None

        self._logger_success("Verified", "Empty UPD is allowed")
