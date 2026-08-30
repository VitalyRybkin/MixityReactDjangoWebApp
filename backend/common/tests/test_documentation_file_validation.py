import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from common.models import Documentation
from common.validators import MAX_DOCUMENTATION_FILE_SIZE
from core.tests.utils import TestLoggerMixin


def make_uploaded_file(
    *,
    name: str,
    content: bytes = b"test",
    content_type: str = "application/octet-stream",
) -> SimpleUploadedFile:
    return SimpleUploadedFile(
        name=name,
        content=content,
        content_type=content_type,
    )


class TestDocumentationFileValidation(TestLoggerMixin):
    def test_pdf_is_allowed(self) -> None:
        self._logger_header("VALIDATION DOCUMENTATION: PDF")

        document = Documentation(
            title="Certificate",
            file=make_uploaded_file(
                name="certificate.pdf",
                content_type="application/pdf",
            ),
        )

        document.full_clean()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ PDF extension accepted"
            f"{self.COLOR['END']}"
        )

    def test_jpg_is_allowed(self) -> None:
        self._logger_header("VALIDATION DOCUMENTATION: JPG")

        document = Documentation(
            title="Certificate",
            file=make_uploaded_file(
                name="certificate.jpg",
                content_type="image/jpeg",
            ),
        )

        document.full_clean()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ JPG extension accepted"
            f"{self.COLOR['END']}"
        )

    def test_html_is_rejected(self) -> None:
        self._logger_header("VALIDATION DOCUMENTATION: HTML")

        document = Documentation(
            title="Certificate",
            file=make_uploaded_file(
                name="certificate.html",
                content=b"<html></html>",
                content_type="text/html",
            ),
        )

        with pytest.raises(ValidationError) as exc:
            document.full_clean()

        assert "file" in exc.value.message_dict

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ HTML extension rejected"
            f"{self.COLOR['END']}"
        )

    def test_oversized_file_is_rejected(self) -> None:
        self._logger_header("VALIDATION DOCUMENTATION: oversized file")

        document = Documentation(
            title="Certificate",
            file=make_uploaded_file(
                name="certificate.pdf",
                content=b"x" * (MAX_DOCUMENTATION_FILE_SIZE + 1),
                content_type="application/pdf",
            ),
        )

        with pytest.raises(ValidationError) as exc:
            document.full_clean()

        assert "file" in exc.value.message_dict

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Oversized file rejected"
            f"{self.COLOR['END']}"
        )
