from unittest.mock import MagicMock, patch

import pytest

from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
    scan_file_for_malware,
)


class TestClamAVScanner:
    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_clean_file(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        mock_settings.CLAMAV_ENABLED = True
        mock_settings.CLAMAV_HOST = "clamav"
        mock_settings.CLAMAV_PORT = 3310
        mock_settings.CLAMAV_TIMEOUT = 10

        sock = MagicMock()
        sock.recv.return_value = b"stream: OK\0"

        mock_create_connection.return_value.__enter__.return_value = sock

        file = MagicMock()
        file.read.side_effect = [
            b"test content",
            b"",
        ]

        scan_file_for_malware(file)

        mock_create_connection.assert_called_once_with(
            ("clamav", 3310),
            timeout=10,
        )

        file.seek.assert_any_call(0)

    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_malware_detected(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        mock_settings.CLAMAV_ENABLED = True
        mock_settings.CLAMAV_HOST = "clamav"
        mock_settings.CLAMAV_PORT = 3310
        mock_settings.CLAMAV_TIMEOUT = 10

        sock = MagicMock()
        sock.recv.return_value = b"stream: Eicar-Test-Signature FOUND\0"

        mock_create_connection.return_value.__enter__.return_value = sock

        file = MagicMock()
        file.read.side_effect = [
            b"infected content",
            b"",
        ]

        with pytest.raises(MalwareDetectedError):
            scan_file_for_malware(file)

        file.seek.assert_any_call(0)

    @patch("core.security.clamav.project_settings")
    @patch(
        "core.security.clamav.socket.create_connection",
        side_effect=ConnectionRefusedError,
    )
    def test_clamav_unavailable(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        mock_settings.CLAMAV_ENABLED = True
        mock_settings.CLAMAV_HOST = "clamav"
        mock_settings.CLAMAV_PORT = 3310
        mock_settings.CLAMAV_TIMEOUT = 10

        file = MagicMock()

        with pytest.raises(
            ClamAVUnavailableError,
            match="ClamAV недоступен",
        ):
            scan_file_for_malware(file)

        file.seek.assert_any_call(0)

    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_scan_disabled(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        mock_settings.CLAMAV_ENABLED = False

        file = MagicMock()

        scan_file_for_malware(file)

        mock_create_connection.assert_not_called()