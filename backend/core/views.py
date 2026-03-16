from rest_framework import generics

from core.models import Documentation


class DocsListAPIView(generics.ListAPIView):
    """
    API view to list all documents.
    """
    queryset = Documentation.objects.all()