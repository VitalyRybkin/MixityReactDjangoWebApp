import shutil
import tempfile
from typing import Any, Literal

import pytest

from django.conf import settings


@pytest.fixture(scope='session', autouse=True)
def temp_media_root(request: Any) -> str:
    temp_dir = tempfile.mkdtemp()
    settings.MEDIA_ROOT = temp_dir

    def cleanup() -> None:
        shutil.rmtree(temp_dir)

    request.addfinalizer(cleanup)
    return temp_dir

def pytest_report_teststatus(report: Any) -> tuple[Any, Literal[''], Literal['']] | None:
    if report.when == 'call' and report.passed:
        return report.outcome, '', ''
    return None
