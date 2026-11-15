import hashlib
import secrets
from datetime import datetime, timedelta

from django.core import signing
from django.core.exceptions import SuspiciousFileOperation
from django.db.models.fields.files import FieldFile
from django.http import Http404
from django.utils import timezone

from common.models import Documentation

DOCUMENTATION_SHARE_SALT = "common.documentation.share.v1"
DOCUMENTATION_SHARE_MAX_AGE = 7 * 24 * 60 * 60
UNAVAILABLE_MESSAGE = "Документ недоступен."


def _file_digest(document: Documentation) -> str:
    if not document.file or not document.file.name:
        raise Http404(UNAVAILABLE_MESSAGE)
    return hashlib.sha256(document.file.name.encode("utf-8")).hexdigest()


def open_shared_document(document: Documentation) -> FieldFile:
    try:
        _file_digest(document)
        return document.file.open("rb")
    except (OSError, ValueError, SuspiciousFileOperation) as error:
        raise Http404(UNAVAILABLE_MESSAGE) from error


def create_documentation_share_tokens(
    ids: list[int],
) -> tuple[list[tuple[Documentation, str]], datetime]:
    unique_ids = list(dict.fromkeys(ids))
    documents = {
        document.pk: document
        for document in Documentation.objects.filter(pk__in=unique_ids)
    }
    if len(documents) != len(unique_ids):
        raise Http404(UNAVAILABLE_MESSAGE)

    ordered = [documents[document_id] for document_id in unique_ids]
    # Validate the complete selection before granting access to any file.
    for document in ordered:
        with open_shared_document(document):
            pass

    signer = signing.TimestampSigner(salt=DOCUMENTATION_SHARE_SALT)
    tokens = [
        (
            document,
            signer.sign_object(
                {
                    "id": document.pk,
                    "file": _file_digest(document),
                    "nonce": secrets.token_urlsafe(16),
                }
            ),
        )
        for document in ordered
    ]
    expires_at = timezone.now() + timedelta(seconds=DOCUMENTATION_SHARE_MAX_AGE)
    return tokens, expires_at


def get_shared_document(token: str) -> Documentation:
    try:
        payload = signing.TimestampSigner(salt=DOCUMENTATION_SHARE_SALT).unsign_object(
            token, max_age=DOCUMENTATION_SHARE_MAX_AGE
        )
        if (
            not isinstance(payload, dict)
            or type(payload.get("id")) is not int
            or payload["id"] < 1
            or not isinstance(payload.get("file"), str)
        ):
            raise ValueError("Invalid document grant")
        document = Documentation.objects.get(pk=payload["id"])
        if not secrets.compare_digest(payload["file"], _file_digest(document)):
            raise ValueError("Document file changed")
        return document
    except (
        signing.BadSignature,
        Documentation.DoesNotExist,
        TypeError,
        ValueError,
        OverflowError,
    ) as error:
        raise Http404(UNAVAILABLE_MESSAGE) from error
