from rest_framework.pagination import PageNumberPagination

from core.openapi.base_views import BaseGenericAPIView
from repairs.models.repair_request_models import RepairRequest
from repairs.serializers.repair_request_serializers import RepairRequestSerializer

class CustomPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

class RepairRequestListAPIView(BaseGenericAPIView):
    resource_name = 'RepairRequest'
    schema_tags = ['Repair Requests']

    read_serializer_class = RepairRequestSerializer
    pagination_class = CustomPagination

    serializer_class = RepairRequestSerializer()
    queryset = RepairRequest.objects.all()

    def get(self, request):
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(self.queryset, request, view=self)
        serializer = self.read_serializer_class(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
