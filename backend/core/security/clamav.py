import socket
import struct
from typing import Protocol

from app_settings import project_settings


CHUNK_SIZE = 64 * 1024


class ScannableFile(Protocol):
    def read(self, size: int = -1) -> bytes: ...

    def seek(
        self,
        offset: int,
        whence: int = 0,
    ) -> int: ...


class ClamAVError(Exception):
    """Base ClamAV error."""


class ClamAVUnavailableError(ClamAVError):
    """ClamAV daemon is unavailable."""


class MalwareDetectedError(ClamAVError):
    """Malware was detected in the uploaded file."""


def scan_file_for_malware(file: ScannableFile) -> None:
    """
    Scan a file using ClamAV clamd INSTREAM protocol.

    Raises
    ------
    MalwareDetectedError
        If ClamAV detects malware.
    ClamAVUnavailableError
        If clamd cannot be reached or returns an invalid response.
    """
    if not project_settings.CLAMAV_ENABLED:
        return

    try:
        file.seek(0)

        with socket.create_connection(
            (
                project_settings.CLAMAV_HOST,
                project_settings.CLAMAV_PORT,
            ),
            timeout=project_settings.CLAMAV_TIMEOUT,
        ) as sock:
            sock.settimeout(project_settings.CLAMAV_TIMEOUT)

            # z = null-terminated clamd command.
            sock.sendall(b"zINSTREAM\0")

            while chunk := file.read(CHUNK_SIZE):
                sock.sendall(struct.pack("!I", len(chunk)))
                sock.sendall(chunk)

            # Zero-length chunk terminates the stream.
            sock.sendall(struct.pack("!I", 0))

            response = sock.recv(4096).decode(
                "utf-8",
                errors="replace",
            ).rstrip("\0")

    except (OSError, socket.timeout) as exc:
        raise ClamAVUnavailableError(
            "ClamAV недоступен."
        ) from exc

    finally:
        file.seek(0)

    if response.endswith(" OK"):
        return

    if " FOUND" in response:
        raise MalwareDetectedError(response)

    raise ClamAVUnavailableError(
        f"Некорректный ответ ClamAV: {response}"
    )