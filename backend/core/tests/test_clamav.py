from unittest.mock import MagicMock, patch

import pytest

from core.security.clamav import (
    ClamAVUnavailableError,
    MalwareDetectedError,
    scan_file_for_malware,
)
from core.tests.utils import TestLoggerMixin


class TestClamAVScanner(TestLoggerMixin):
    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_clean_file(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        """
        Test that a clean file is not detected as malware.
        """
        self._logger_header("SECURITY: ClamAV clean file")
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

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Clean file accepted by ClamAV scanner"
            f"{self.COLOR['END']}"
        )

    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_malware_detected(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        """
        Test that a malware file is detected by ClamAV scanner.
        """
        self._logger_header("SECURITY: ClamAV malware detected")
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

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ Malware detected by ClamAV scanner"
            f"{self.COLOR['END']}"
        )

    @patch("core.security.clamav.project_settings")
    @patch(
        "core.security.clamav.socket.create_connection",
        side_effect=ConnectionRefusedError,
    )
    def test_clamav_unavailable(
        self,
        mock_settings: MagicMock,
        mock_create_connection: MagicMock,
    ) -> None:
        """
        Test that ClamAV scanner is unavailable.
        """
        self._logger_header("SECURITY: ClamAV ClamAV unavailable")
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

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ ClamAV scanner is unavailable"
            f"{self.COLOR['END']}"
        )

    @patch("core.security.clamav.project_settings")
    @patch("core.security.clamav.socket.create_connection")
    def test_scan_disabled(
        self,
        mock_create_connection: MagicMock,
        mock_settings: MagicMock,
    ) -> None:
        """
        Test that ClamAV scanner is disabled.
        """
        self._logger_header("SECURITY: ClamAV ClamAV disabled")
        mock_settings.CLAMAV_ENABLED = False

        file = MagicMock()

        scan_file_for_malware(file)

        mock_create_connection.assert_not_called()

        print(
            f"{self.INDENT}{self.COLOR['OK']}"
            "✓ ClamAV scanner is disabled"
            f"{self.COLOR['END']}"
        )
