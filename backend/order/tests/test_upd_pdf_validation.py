from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from pypdf import PdfWriter

from order.serializers.order_serializers.create_order_serializers import (
    MAX_UPD_PDF_SIZE,
    OrderWriteSerializer,
)


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
class TestUpdPdfValidation:
    def test_valid_pdf(self) -> None:
        file = make_uploaded_file(make_pdf())

        serializer = OrderWriteSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["upd_pdf"] is not None

    def test_fake_pdf_rejected(self) -> None:
        file = make_uploaded_file(
            b"This is not a PDF file",
        )

        serializer = OrderWriteSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

    def test_broken_pdf_rejected(self) -> None:
        file = make_uploaded_file(
            b"%PDF-1.7\nbroken pdf content",
        )

        serializer = OrderWriteSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

    def test_oversized_pdf_rejected(self) -> None:
        content = (
            b"%PDF-1.7\n"
            + b"x" * (MAX_UPD_PDF_SIZE + 1)
        )

        file = make_uploaded_file(content)

        serializer = OrderWriteSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

    def test_encrypted_pdf_rejected(self) -> None:
        file = make_uploaded_file(
            make_pdf(encrypted=True),
        )

        serializer = OrderWriteSerializer(
            data={"upd_pdf": file},
            partial=True,
        )

        assert not serializer.is_valid()
        assert "upd_pdf" in serializer.errors

    def test_null_is_allowed(self) -> None:
        serializer = OrderWriteSerializer(
            data={"upd_pdf": None},
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["upd_pdf"] is None