"""Verify generated OpenAPI contracts for selected endpoints."""

from typing import Any, ClassVar

from django.test import SimpleTestCase
from django.urls import reverse
from drf_spectacular.generators import SchemaGenerator

from catalog.api.routes import QualityPassportRoutes
from common.routes import DocumentationRoutes
from core.tests.utils import TestLoggerMixin


class OpenApiSchemaTests(TestLoggerMixin, SimpleTestCase):
    """Check request and response shapes in the public OpenAPI document."""

    document: ClassVar[dict[str, Any]]

    @classmethod
    def setUpClass(cls) -> None:
        """Generate the public OpenAPI document once for the test class."""
        super().setUpClass()
        document = SchemaGenerator().get_schema(public=True)
        assert document is not None
        cls.document = document

    def test_quality_passport_state_is_an_object_with_query_parameters(self) -> None:
        """Check the state response schema and its query parameters."""
        self._logger_header(
            "OPENAPI SCHEMA: "
            "QUALITY PASSPORT STATE IS AN OBJECT WITH QUERY PARAMETERS"
        )
        path = reverse(f"catalog:{QualityPassportRoutes.STATE.name}")
        operation = self.document["paths"][path]["get"]
        response = operation["responses"]["200"]["content"]["application/json"][
            "schema"
        ]

        self.assertEqual(
            response, {"$ref": "#/components/schemas/QualityPassportState"}
        )
        self.assertEqual(
            self.document["components"]["schemas"]["QualityPassportState"]["type"],
            "object",
        )
        self.assertEqual(
            {parameter["name"] for parameter in operation["parameters"]},
            {"order_id", "product_id", "quantity", "source", "target_status"},
        )
        self._logger_success(
            "Quality passport state is an object with query parameters",
            "State response and parameters documented",
        )

    def test_document_bulk_download_documents_json_input_and_binary_zip_output(
        self,
    ) -> None:
        """Check the bulk download’s JSON input and binary ZIP response."""
        self._logger_header(
            "OPENAPI SCHEMA: "
            "DOCUMENT BULK DOWNLOAD DOCUMENTS JSON INPUT AND BINARY ZIP OUTPUT"
        )
        path = reverse(f"common:{DocumentationRoutes.DOWNLOAD_ZIP.name}")
        operation = self.document["paths"][path]["post"]
        request = operation["requestBody"]["content"]["application/json"]["schema"]
        request_name = request["$ref"].rsplit("/", 1)[-1]

        self.assertIn(
            "ids", self.document["components"]["schemas"][request_name]["properties"]
        )
        self.assertEqual(
            operation["responses"]["200"]["content"],
            {"application/zip": {"schema": {"type": "string", "format": "binary"}}},
        )
        self.assertNotIn("201", operation["responses"])
        self._logger_success(
            "Document bulk download documents json input and binary zip output",
            "Request and response media types documented",
        )
