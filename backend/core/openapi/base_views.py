from typing import ClassVar, Any, Type

from rest_framework import generics, serializers

from core.openapi import ERRORS_DETAIL
from core.openapi.schema_factories import list_create_schema, retrieve_update_destroy_schema, resources_schema, \
    update_patch_schema, create_schema, list_schema


class BaseListCreateAPIView(generics.ListCreateAPIView):

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

    Methods:
        as_view(**kwargs): Overrides the default as_view method to inject schema creation
            logic and return a properly decorated view for the API endpoint.
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
    """
    Base class for a generic API view.

    Attributes:
        resource_name (str): A class-level string attribute indicating the name
            of the resource. It is used for schema generation and resource identification.
        schema_tags (list[str]): A class-level list of strings representing schema
            tags associated with this API view for documentation purposes.
        read_serializer_class (Type[serializers.BaseSerializer]): A class-level
            serializer used for read operations within the API view.

    Methods:
        as_view(**kwargs): Overrides the default as_view method to inject schema creation
            logic and return a properly decorated view for the API endpoint.
    """
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
    """
    BaseUpdateGenericAPIView is a generic view for handling update operations via PUT or PATCH requests.

    Attributes:
        resource_name (ClassVar[str]): The name of the resource being updated. It is used for documentation purposes
            and API schema generation.
        schema_tags (ClassVar[list[str]]): A list of tags used for categorizing the API endpoints in documentation and
            schema generation.
        errors_read (dict[int, Any]): A dictionary that maps HTTP status codes to corresponding error responses. This
            dictionary defines the errors that may be returned by the endpoint.
        update_serializer_class (ClassVar[Type[serializers.BaseSerializer]]): The serializer class is specifically used
            for handling data validation and deserialization during update operations.
            Methods:

    Methods:
        as_view(**kwargs): Overrides the default as_view method to inject schema creation
            logic and return a properly decorated view for the API endpoint.
    """
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

class BaseCreateAPIView(generics.CreateAPIView):
    """
    BaseCreateAPIView is a base class for creating API views in Django REST framework.

    This class extends the functionality of Django REST framework's CreateAPIView, providing
    custom schema support and tag annotations for the API endpoint. It enables developers
    to define API resource names, schema tags, and serializers for their API endpoints
    in a consistent manner.

    Attributes:
        resource_name (str): The name of the API resource. Defaults to an empty string.
        schema_tags (list[str]): A list of tags used for API schema generation.
        read_serializer_class (Type[serializers.BaseSerializer]): The serializer class
            used for reading API responses. Defaults to `serializers.Serializer`.

    Methods:
        as_view(**kwargs): Overrides the default as_view method to inject schema creation
            logic and return a properly decorated view for the API endpoint.
    """
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []

    read_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: Any) -> Any:
        decorated = create_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            read_serializer=cls.read_serializer_class,
        )(cls)

        return super(BaseCreateAPIView, decorated).as_view(**kwargs)

class BaseListAPIView(generics.ListAPIView):
    resource_name: ClassVar[str] = ""
    schema_tags: ClassVar[list[str]] = []

    read_serializer_class: ClassVar[Type[serializers.BaseSerializer]] = serializers.Serializer

    @classmethod
    def as_view(cls, **kwargs: Any) -> Any:
        decorated = list_schema(
            resource=cls.resource_name,
            tags=cls.schema_tags,
            read_serializer=cls.read_serializer_class,
            errors_read=ERRORS_DETAIL,
        )(cls)

        return super(BaseListAPIView, decorated).as_view(**kwargs)