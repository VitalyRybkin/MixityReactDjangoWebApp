from typing import Any, Union

from django.contrib import admin, messages
from django.http import HttpRequest

from core.models.models import Documentation, Organisation


class BaseAdmin(admin.ModelAdmin):
    """
    Provides customizations for model administration in Django.
    """

    def message_user(
        self,
        request: HttpRequest,
        message: Any,
        level: Union[int, str] = messages.SUCCESS,
        extra_tags: str = '',
        fail_silently: bool = False
    ) -> None:
        """
        Displays a custom success, informational, or error message to the user, typically used within
        Django admin actions for feedback. This method customizes the default message based on the type
        of operation performed (add, change, delete) and appends appropriate emojis and localized
        messages for better context and readability.

        Attributes:
            request: The current instance of the HttpRequest associated with the user action.
            message: The original message string or object to display to the user. It will be
                processed into a custom message if it matches specific patterns.
            level: The level of the message, categorized as success, info, warning, or error.
                Accepts integers or string values corresponding to Django's messaging levels.
            extra_tags: Additional tags to include with the message, separated by spaces.
            fail_silently: Boolean determining if any issues with displaying the message should
                raise an error or fail silently.
        """
        msg_str = str(message)
        verbose_name = self.model._meta.verbose_name.capitalize()

        if 'was added successfully' in msg_str:
            message = f'✅ {verbose_name} успешно добавлен(а)!'
        elif 'was changed successfully' in msg_str:
            message = f'📝 {verbose_name} успешно обновлен(а)!'
        elif 'was deleted successfully' in msg_str:
            message = f'🗑️ {verbose_name} удален(а).'

        return super().message_user(request, message, level, extra_tags, fail_silently)


@admin.register(Documentation)
class DocumentationAdmin(BaseAdmin):
    list_display = (
        "title",
        "file",
        "status",
        "tag",
    )

@admin.register(Organisation)
class OrganizationAdmin(BaseAdmin):
    list_display = (
        "short_name",
        "full_name",
        "address",
        "inn",
        "kpp",
        "ceo_name"
    )