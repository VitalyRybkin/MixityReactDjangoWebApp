from django.urls import path

from carrier.views.carriers import CarrierDetailAPIView, CarrierListAPIView
from carrier.views.trucks import TrucksDetailAPIView, TrucksListAPIView

urlpatterns = [
    path("carriers/", CarrierListAPIView.as_view(), name="carrier_list"),
    path("carriers/<int:pk>/", CarrierDetailAPIView.as_view(), name="carrier_detail"),
    path("trucks/", TrucksListAPIView.as_view(), name="trucks_list"),
    path("trucks/<int:pk>/", TrucksDetailAPIView.as_view(), name="trucks_detail"),
]
