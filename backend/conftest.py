import shutil
import tempfile

import pytest

from django.conf import settings


@pytest.fixture(scope='session', autouse=True)
def temp_media_root(request):
    temp_dir = tempfile.mkdtemp()
    settings.MEDIA_ROOT = temp_dir

    def cleanup():
        shutil.rmtree(temp_dir)

    request.addfinalizer(cleanup)
    return temp_dir