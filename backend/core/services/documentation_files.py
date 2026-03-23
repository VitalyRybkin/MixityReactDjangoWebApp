import os
import zipfile
from io import BytesIO
from typing import BinaryIO

from django.http import Http404

from core.models import Documentation


def get_documentation_file_parts(doc: Documentation) -> tuple[BinaryIO, str]:
    if not doc.file:
        raise Http404("Файл не найден")

    return doc.file.open("rb"), os.path.basename(doc.file.name)


def get_ordered_documents(ids: list[int]) -> list[Documentation]:
    documents_map = {
        doc.id: doc for doc in Documentation.objects.filter(id__in=ids)
    }
    ordered_documents = [documents_map[doc_id] for doc_id in ids if doc_id in documents_map]

    if not ordered_documents:
        raise Http404("Документы не найдены")

    return ordered_documents


def build_documents_zip(ids: list[int]) -> BytesIO:
    ordered_documents = get_ordered_documents(ids)
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        used_names: set[str] = set()

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

            with doc.file.open("rb") as f:
                zip_file.writestr(safe_name, f.read())

    zip_buffer.seek(0)
    return zip_buffer