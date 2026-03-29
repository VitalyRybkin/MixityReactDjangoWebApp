from typing import Any, Protocol
from rest_framework import status
from rest_framework.response import Response


class APIViewProtocol(Protocol):
    def get_object(self) -> Any: ...
    def get_serializer(self, *args: Any, **kwargs: Any) -> Any: ...
    def perform_destroy(self, instance: Any) -> None: ...


class SoftDeleteResponseMixin:
    """
    Provides functionality for soft deletion in resources.
    """

    def perform_destroy(self, instance: Any) -> None:
        if hasattr(instance, "is_active"):
            instance.is_active = False
            instance.save(update_fields=["is_active"])

    def destroy(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        instance = self.get_object()  # type: ignore
        self.perform_destroy(instance)

        serializer = self.get_serializer(instance)  # type: ignore
        return Response(serializer.data, status=status.HTTP_200_OK)