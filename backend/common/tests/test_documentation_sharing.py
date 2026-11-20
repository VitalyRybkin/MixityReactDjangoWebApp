import hashlib
import importlib
import time
from collections.abc import Callable, Iterable
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, cast
from unittest.mock import patch
from urllib.parse import urlsplit

import pytest
import pytest_django.fixtures
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission, User
from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from django.http import FileResponse
from django.test import override_settings
from django.urls import clear_url_caches, reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

import backend.urls as project_urls
from common.models import Documentation
from common.services.documentation_sharing import (
    DOCUMENTATION_SHARE_MAX_AGE,
    DOCUMENTATION_SHARE_SALT,
)

pytestmark = pytest.mark.django_db
ISSUE_URL = "/api/common/documentation/share-links/"
CONTENT = b"%PDF-1.4 documentation recipient fixture"


@pytest.fixture
def document_factory() -> Callable[..., Documentation]:
    def create(title: str = "Certificate") -> Documentation:
        return Documentation.objects.create(
            title=title,
            file=SimpleUploadedFile(f"{title}.pdf", CONTENT, "application/pdf"),
        )

    return create


@pytest.fixture
def viewer() -> User:
    user = get_user_model().objects.create_user(username="documentation_viewer")
    user.user_permissions.add(
        Permission.objects.get(
            codename="view_documentation", content_type__app_label="common"
        )
    )
    return user


@pytest.fixture
def sharing_client(viewer: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(viewer)
    return client


def issue_link(client: APIClient, document: Documentation) -> str:
    response = client.post(ISSUE_URL, {"ids": [document.pk]}, format="json")
    assert response.status_code == 200, response.data
    return urlsplit(response.data["links"][0]["url"]).path


def token_from_url(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1]


def shared_url(token: str) -> str:
    return reverse("common:documentation_shared_file", args=[token])


def test_issuance_requires_authentication(
    document_factory: Callable[..., Documentation],
) -> None:
    document = document_factory()
    response = APIClient().post(ISSUE_URL, {"ids": [document.pk]}, format="json")
    assert response.status_code == 401


def test_issuance_requires_documentation_view_permission(
    document_factory: Callable[..., Documentation],
) -> None:
    user = get_user_model().objects.create_user(username="no_documentation_permission")
    client = APIClient()
    client.force_authenticate(user)
    document = document_factory()
    assert (
        client.post(ISSUE_URL, {"ids": [document.pk]}, format="json").status_code == 403
    )


def test_view_permission_grants_only_selected_files_with_fresh_expiring_links(
    sharing_client: APIClient,
    viewer: User,
    document_factory: Callable[..., Documentation],
) -> None:
    first = document_factory("First certificate")
    second = document_factory("Second certificate")
    document_factory("Unselected certificate")
    assert not viewer.has_perm("common.add_documentation")

    response = sharing_client.post(
        ISSUE_URL, {"ids": [second.pk, first.pk]}, format="json"
    )

    assert response.status_code == 200
    assert [(link["id"], link["title"]) for link in response.data["links"]] == [
        (second.pk, second.title),
        (first.pk, first.title),
    ]
    expires_at = datetime.fromisoformat(response.data["expires_at"])
    assert expires_at.utcoffset() == timedelta(0)
    assert (
        abs((expires_at - timezone.now()).total_seconds() - DOCUMENTATION_SHARE_MAX_AGE)
        < 5
    )
    first_url = response.data["links"][1]["url"]
    payload = signing.TimestampSigner(salt=DOCUMENTATION_SHARE_SALT).unsign_object(
        token_from_url(first_url)
    )
    assert payload["id"] == first.pk
    assert payload["file"] == hashlib.sha256(first.file.name.encode()).hexdigest()
    assert first.file.name not in str(payload)
    assert issue_link(sharing_client, first) != urlsplit(first_url).path


@pytest.mark.parametrize(
    "ids", [[], [0], [-1], ["invalid"], [None], list(range(1, 102))]
)
def test_issuance_rejects_invalid_or_oversized_selections(
    sharing_client: APIClient, ids: list[Any]
) -> None:
    assert (
        sharing_client.post(ISSUE_URL, {"ids": ids}, format="json").status_code == 400
    )


def test_issuance_accepts_the_maximum_selection_size(
    sharing_client: APIClient, document_factory: Callable[..., Documentation]
) -> None:
    documents = [document_factory(f"Certificate {index}") for index in range(100)]
    response = sharing_client.post(
        ISSUE_URL, {"ids": [document.pk for document in documents]}, format="json"
    )
    assert response.status_code == 200
    assert len(response.data["links"]) == 100


@pytest.mark.parametrize("unavailable", ["unknown_id", "empty_file", "missing_file"])
def test_issuance_validates_the_complete_batch_before_signing(
    sharing_client: APIClient,
    document_factory: Callable[..., Documentation],
    unavailable: str,
) -> None:
    first = document_factory("Available")
    second = document_factory("Unavailable")
    unavailable_id = second.pk
    if unavailable == "unknown_id":
        second.delete()
    elif unavailable == "empty_file":
        second.file = ""
        second.save(update_fields=["file"])
    else:
        second.file.storage.delete(second.file.name)

    with patch("django.core.signing.TimestampSigner.sign_object") as sign:
        response = sharing_client.post(
            ISSUE_URL, {"ids": [first.pk, unavailable_id]}, format="json"
        )
    assert response.status_code == 404
    assert "links" not in response.data
    sign.assert_not_called()


@pytest.mark.parametrize("expired_jwt", [False, True])
def test_recipient_can_stream_the_file_without_an_active_login(
    sharing_client: APIClient,
    document_factory: Callable[..., Documentation],
    viewer: User,
    expired_jwt: bool,
) -> None:
    document = document_factory()
    url = issue_link(sharing_client, document)
    recipient = APIClient()
    if expired_jwt:
        token = AccessToken.for_user(viewer)
        token.set_exp(lifetime=timedelta(seconds=-1))
        recipient.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    response = recipient.get(url)

    assert response.status_code == 200
    assert response.streaming
    assert (
        b"".join(cast(Iterable[bytes], cast(FileResponse, response).streaming_content))
        == CONTENT
    )
    assert "Location" not in response
    assert response["Content-Type"] == "application/pdf"
    assert "no-store" in response["Cache-Control"]
    assert "private" in response["Cache-Control"]
    assert response["Referrer-Policy"] == "no-referrer"
    assert response["X-Content-Type-Options"] == "nosniff"
    response.close()


@pytest.mark.parametrize(
    "invalid_grant", ["tampered", "expired", "wrong_salt", "wrong_document"]
)
def test_invalid_grants_return_the_same_generic_not_found_response(
    sharing_client: APIClient,
    document_factory: Callable[..., Documentation],
    invalid_grant: str,
) -> None:
    document = document_factory()
    url = issue_link(sharing_client, document)
    token = token_from_url(url)
    signer = signing.TimestampSigner(salt=DOCUMENTATION_SHARE_SALT)
    payload = signer.unsign_object(token)
    if invalid_grant == "tampered":
        token = ("x" if token[0] != "x" else "y") + token[1:]
    elif invalid_grant == "expired":
        with patch(
            "django.core.signing.time.time",
            return_value=time.time() - DOCUMENTATION_SHARE_MAX_AGE - 1,
        ):
            token = signer.sign_object(payload)
    elif invalid_grant == "wrong_salt":
        token = signing.TimestampSigner(salt="another-purpose").sign_object(payload)
    else:
        payload["id"] = document_factory("Different file").pk
        token = signer.sign_object(payload)

    recipient = APIClient()
    response = recipient.get(shared_url(token))
    assert response.status_code == 404
    assert response.data == recipient.get(shared_url("invalid")).data
    assert "no-store" in response["Cache-Control"]


@pytest.mark.parametrize(
    "change", ["deleted", "missing_file", "empty_file", "replacement"]
)
def test_grants_stop_working_when_the_document_or_its_file_changes(
    sharing_client: APIClient,
    document_factory: Callable[..., Documentation],
    change: str,
) -> None:
    document = document_factory()
    url = issue_link(sharing_client, document)
    if change == "deleted":
        document.delete()
    elif change == "missing_file":
        document.file.storage.delete(document.file.name)
    elif change == "empty_file":
        document.file = ""
        document.save(update_fields=["file"])
    else:
        document.file.save(
            "replacement.pdf", SimpleUploadedFile("replacement.pdf", b"replacement")
        )

    response = APIClient().get(url)
    assert response.status_code == 404
    assert response.data == APIClient().get(shared_url("invalid")).data


@pytest.mark.parametrize(
    "route",
    [
        "documentation_list",
        "documentation_detail",
        "documentation_download",
        "documentation_download_zip",
    ],
)
def test_original_documentation_routes_still_require_authentication(
    document_factory: Callable[..., Documentation], route: str
) -> None:
    document = document_factory()
    client = APIClient()
    if route == "documentation_download_zip":
        response = client.post(
            reverse(f"common:{route}"), {"ids": [document.pk]}, format="json"
        )
    else:
        args = [] if route == "documentation_list" else [document.pk]
        response = client.get(reverse(f"common:{route}", args=args))
    assert response.status_code == 401


@pytest.mark.parametrize("debug", [False, True])
@pytest.mark.parametrize("prefix", ["docs/", "/docs/", "maps/../docs/", "DOCS/"])
def test_raw_documentation_media_is_denied_even_when_the_file_exists(
    document_factory: Callable[..., Documentation], debug: bool, prefix: str
) -> None:
    document = document_factory()
    assert document.file.storage.exists(document.file.name)
    try:
        with override_settings(DEBUG=debug):
            # Rebuild the DEBUG-dependent URL patterns, not merely the setting.
            importlib.reload(project_urls)
            clear_url_caches()
            filename = document.file.name.split("/", 1)[1]
            response = APIClient().get(f"/media/{prefix}{filename}")
            assert response.status_code == 404
    finally:
        importlib.reload(project_urls)
        clear_url_caches()


def test_development_media_still_serves_non_documentation_files(
    settings: pytest_django.fixtures.SettingsWrapper,
) -> None:
    target = Path(settings.MEDIA_ROOT) / "maps" / "public-map.png"
    target.parent.mkdir(exist_ok=True)
    target.write_bytes(b"public map")
    try:
        with override_settings(DEBUG=True):
            importlib.reload(project_urls)
            clear_url_caches()
            response = APIClient().get("/media/maps/public-map.png")
            assert response.status_code == 200
            assert (
                b"".join(
                    cast(
                        Iterable[bytes], cast(FileResponse, response).streaming_content
                    )
                )
                == b"public map"
            )
            response.close()
    finally:
        importlib.reload(project_urls)
        clear_url_caches()
