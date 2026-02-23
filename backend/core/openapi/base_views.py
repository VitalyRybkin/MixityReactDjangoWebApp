from typing import ClassVar, Any, Type

from rest_framework import generics, serializers

from core.openapi.schema_factories import list_create_schema, retrieve_update_destroy_schema, resources_schema, \
    update_patch_schema


class BaseListCreateAPIView(generics.ListCreateAPIView):
    """
    Base class that extends ListCreateAPIView to provide custom schema and serializer behavior.

    Attributes:
        resource_name: Name of the resource associated with this view.
        schema_tags: List of schema tags used for API documentation.
        read_serializer: Instance of the serializer used for reading operations.
        write_serializer: Instance of the serializer used for writing operations.
        errors_read: Dictionary mapping HTTP status codes to descriptions or objects for reading
            errors.
        errors_write: Dictionary mapping HTTP status codes to descriptions or objects for writing
            errors.
        read_serializer_class: Serializer class used for reading operations.
        write_serializer_class: Serializer class used for writing operations.
    """
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []
    read_serializer: Any
    write_serializer: Any
    errors_read: dict[int, Any]
    errors_write: dict[int, Any]


    read_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer
    write_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: dict) -> Any:
        decorated = list_create_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            read_serializer=cls.read_serializer_class,
            write_serializer=cls.write_serializer_class,
        )(cls)
        return super(BaseListCreateAPIView, decorated).as_view(**kwargs)


class BaseRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Base class that extends RetrieveUpdateDestroyAPIView to provide custom schema and serializer behavior.

    Attributes:
        resource_name: The name of the resource this view handles.
        schema_tags: List of tags used for schema organization and grouping.
        read_serializer_class: Serializer class used for reading resource data.
        write_serializer_class: Serializer class used for handling incoming
                                 request data. Typically used for validation.
    """
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []

    read_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer
    write_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: Any) -> Any:
        decorated = retrieve_update_destroy_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            read_serializer=cls.read_serializer_class,
            request_serializer=cls.write_serializer_class,
        )(cls)

        return super(BaseRetrieveUpdateDestroyAPIView, decorated).as_view(**kwargs)

class BaseGenericAPIView(generics.GenericAPIView):
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []

    read_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: Any) -> Any:
        decorated = resources_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            read_serializer=cls.read_serializer_class,
        )(cls)

        return super(BaseGenericAPIView, decorated).as_view(**kwargs)

class BaseUpdateGenericAPIView(generics.UpdateAPIView):
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []
    errors_read: dict[int, Any]

    update_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: Any) -> Any:
        decorated = update_patch_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            serializer=cls.update_serializer_class,
            errors_read=cls.errors_read,
        )(cls)
        return super(BaseUpdateGenericAPIView, decorated).as_view(**kwargs)