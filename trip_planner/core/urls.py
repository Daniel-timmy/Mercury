from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogSheetViewSet, LogEntryViewSet, TripViewSet, DriverPositionViewSet

router = DefaultRouter()
router.register(r'logsheets', LogSheetViewSet, basename='logsheets')
router.register(r'logentries', LogEntryViewSet, basename='logentries')
router.register(r'trips', TripViewSet, basename='trips')
router.register(r'trip/driver-positions', DriverPositionViewSet, basename='driver-positions')

urlpatterns = [
    path('', include(router.urls)),
]   