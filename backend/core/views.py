from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny

from core.models import Documentation
from core.serializers import DocumentationSerializer


class DocsListAPIView(generics.ListAPIView):
    """
    API view to list all documents.
    """
    queryset = Documentation.objects.all()
    serializer_class = DocumentationSerializer
    permission_classes = [AllowAny]