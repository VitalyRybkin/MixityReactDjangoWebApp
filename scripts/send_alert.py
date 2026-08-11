import os
import smtplib
import ssl
import sys
from email.message import EmailMessage


def main() -> int:
    subject = sys.argv[1] if len(sys.argv) > 1 else "[Mixity] Monitoring alert"
    body = sys.stdin.read()

    smtp_host = os.environ["SMTP_HOST"]
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_password = os.environ["SMTP_PASSWORD"]

    alert_from = os.environ.get("ALERT_FROM", smtp_user)
    alert_to = os.environ["ALERT_TO"]

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = alert_from
    message["To"] = alert_to
    message.set_content(body)

    context = ssl.create_default_context()

    with smtplib.SMTP_SSL(
        smtp_host,
        smtp_port,
        context=context,
        timeout=15,
    ) as smtp:
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())