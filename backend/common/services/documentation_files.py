"""Services for opening documentation files and building bounded ZIP archives."""

import os
import tempfile
import zipfile
from typing import IO

from django.db.models.fields.files import FieldFile
from django.http import Http404
from rest_framework.exceptions import ValidationError

from common.models import Documentation

MAX_DOCUMENTATION_ZIP_FILES = 50
MAX_DOCUMENTATION_ZIP_SOURCE_BYTES = 100 * 1024 * 1024
ZIP_SPOOL_MEMORY_BYTES = 8 * 1024 * 1024
ZIP_COPY_CHUNK_BYTES = 1024 * 1024


def get_documentation_file_parts(doc: Documentation) -> tuple[FieldFile, str]:
    """Open a documentation file; return 404 if the stored reference is stale."""
    if not doc.file:
        raise Http404("Файл не найден")
    try:
        return doc.file.open("rb"), os.path.basename(doc.file.name)
    except FileNotFoundError as exc:
        raise Http404("Файл не найден") from exc


def get_ordered_documents(ids: list[int]) -> list[Documentation]:
    """Resolve unique documents in user-supplied order."""
    unique_ids = list(dict.fromkeys(ids))
    if len(unique_ids) > MAX_DOCUMENTATION_ZIP_FILES:
        raise ValidationError(
            {
                "ids": (
                    f"Можно скачать не более {MAX_DOCUMENTATION_ZIP_FILES} "
                    "документов за раз."
                )
            }
        )
    documents_map = {
        doc.id: doc for doc in Documentation.objects.filter(id__in=unique_ids)
    }
    ordered_documents = [
        documents_map[doc_id] for doc_id in unique_ids if doc_id in documents_map
    ]
    if not ordered_documents:
        raise Http404("Документы не найдены")
    return ordered_documents


def build_documents_zip(ids: list[int]) -> IO[bytes]:
    """Build a bounded ZIP, spilling to disk rather than keeping it all in RAM.

    Caller owns the returned seekable file; FileResponse closes it after use.
    """
    ordered_documents = get_ordered_documents(ids)
    zip_buffer = tempfile.SpooledTemporaryFile(
        max_size=ZIP_SPOOL_MEMORY_BYTES, mode="w+b"
    )
    try:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            used_names: set[str] = set()
            total_bytes = 0

            for doc in ordered_documents:
                if not doc.file:
                    continue

                original_name = os.path.basename(doc.file.name)
                name, ext = os.path.splitext(original_name)
                safe_name = original_name
                counter = 1
                while safe_name in used_names:
                    safe_name = f"{name}_{counter}{ext}"
                    counter += 1
                used_names.add(safe_name)

                try:
                    with doc.file.open("rb") as source:
                        with zip_file.open(safe_name, "w") as target:
                            while chunk := source.read(ZIP_COPY_CHUNK_BYTES):
                                total_bytes += len(chunk)
                                if total_bytes > MAX_DOCUMENTATION_ZIP_SOURCE_BYTES:
                                    raise ValidationError(
                                        {
                                            "ids": "Суммарный размер документов превышает 100 МБ."
                                        }
                                    )
                                target.write(chunk)
                except FileNotFoundError as exc:
                    raise Http404("Файл не найден") from exc

        zip_buffer.seek(0)
        return zip_buffer
    except Exception:
        zip_buffer.close()
        raise
