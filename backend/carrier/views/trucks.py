from rest_framework import generics

from carrier.models import Truck


class TrucksListAPIView(generics.ListAPIView):
    class Meta:
        model = Truck
        fields = "__all__"


class TrucksDetailAPIView(generics.RetrieveAPIView):
    class Meta:
        model = Truck
        fields = "__all__"
        lookup_field = "id"
