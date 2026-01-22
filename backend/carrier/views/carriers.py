from rest_framework import generics

from carrier.models import Carrier


class CarrierDetailAPIView(generics.RetrieveAPIView):
    class Meta:
        model = Carrier
        fields = "__all__"
        lookup_field = "id"


class CarrierListAPIView(generics.ListAPIView):
    class Meta:
        model = Carrier
        fields = "__all__"
