"""Regression tests for stale documentation files and bounded bulk ZIP downloads."""

import io
import tempfile
import zipfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.http import FileResponse
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from common.models import Documentation
from common.routes import DocumentationRoutes
from common.services.documentation_files import build_documents_zip
from core.tests.utils import TestLoggerMixin


class TestDocumentationFilesRegression(TestLoggerMixin, APITestCase):
    """Use real model records and a temporary media root, not mock documents."""

    def setUp(self) -> None:
        super().setUp()
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)
        override = override_settings(MEDIA_ROOT=self.tmpdir.name)
        override.enable()
        self.addCleanup(override.disable)
        user = get_user_model().objects.create_superuser(
            username="docs_regression_admin", password="test_password"
        )
        self.client.force_authenticate(user=user)

    def _document(
        self, title: str, data: bytes = b"%PDF-1.4\nmock-content"
    ) -> Documentation:
        doc = Documentation.objects.create(title=title)
        doc.file.save(f"{title}.pdf", ContentFile(data), save=True)
        return doc

    def test_inline_and_download_missing_file_return_404(self) -> None:
        self._logger_header("ENDPOINT: DOCUMENT FILE NOT FOUND")
        doc = Documentation.objects.create(
            title="missing-file", file="docs/absent-file.pdf"
        )
        for route in (DocumentationRoutes.DETAIL, DocumentationRoutes.DOWNLOAD):
            with self.subTest(route=route.name):
                url = reverse(f"common:{route.name}", args=[doc.pk])
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self._logger_success("documentation", "Both file routes return 404")

    def test_zip_deduplicates_ids_and_streams_archive(self) -> None:
        self._logger_header("ENDPOINT: BOUNDED DOCUMENT ZIP")
        doc = self._document("zip-one")
        url = reverse(f"common:{DocumentationRoutes.DOWNLOAD_ZIP.name}")
        response = self.client.post(url, {"ids": [doc.pk, doc.pk]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assert isinstance(response, FileResponse)
        archive = io.BytesIO(b"".join(response.streaming_content))
        response.close()
        with zipfile.ZipFile(archive) as zf:
            self.assertEqual(zf.namelist(), ["zip-one.pdf"])
        self._logger_success("documentation", "One file in streaming ZIP")

    def test_too_many_document_ids_return_400(self) -> None:
        self._logger_header("VALIDATION: DOCUMENT ZIP ID LIMIT")
        url = reverse(f"common:{DocumentationRoutes.DOWNLOAD_ZIP.name}")
        response = self.client.post(url, {"ids": list(range(1, 52))}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self._logger_success("ids", "More than 50 IDs rejected")

    def test_archive_source_bytes_are_capped(self) -> None:
        self._logger_header("SERVICE: DOCUMENT ZIP BYTES LIMIT")
        doc = self._document("zip-large", data=b"%PDF" + b"A" * 50)
        with patch(
            "common.services.documentation_files.MAX_DOCUMENTATION_ZIP_SOURCE_BYTES",
            20,
        ):
            with self.assertRaises(ValidationError):
                build_documents_zip([doc.pk])
        self._logger_success("documentation", "Oversized ZIP rejected")

    def test_zip_missing_physical_file_returns_404(self) -> None:
        self._logger_header("SERVICE: DOCUMENT ZIP STALE REFERENCE")
        doc = Documentation.objects.create(
            title="stale-zip", file="docs/no-longer-here.pdf"
        )
        url = reverse(f"common:{DocumentationRoutes.DOWNLOAD_ZIP.name}")
        response = self.client.post(url, {"ids": [doc.pk]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self._logger_success("documentation", "Missing ZIP member rejected with 404")
