from dataclasses import dataclass

from rest_framework import status


@dataclass(frozen=True)
class UploadSpec:
    """
    Describes what we expect from an upload endpoint.
    """

    field_name: str
    upload_to: str = ""
    method: str = "patch"
    expected_status: int = status.HTTP_200_OK
    content_type: str = "image/png"
    filename: str = "file.png"
    file_bytes: bytes = b"\x89PNG\r\n\x1a\n" + b"0" * 2048
