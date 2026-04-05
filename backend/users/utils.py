import threading
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags

def send_async_email(subject, html_content, recipient_list):
    """
    Sends an email asynchronously using a thread.
    Automatically generates a plain-text version from the HTML content.
    """
    text_content = strip_tags(html_content)
    from_email = settings.DEFAULT_FROM_EMAIL

    def send():
        try:
            send_mail(
                subject,
                text_content,
                from_email,
                recipient_list,
                html_message=html_content,
                fail_silently=False,
            )
        except Exception as e:
            # In production, you'd use a logger here
            print(f"Async email failed to {recipient_list}: {str(e)}")

    thread = threading.Thread(target=send)
    thread.start()
