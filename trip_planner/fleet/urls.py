from .views import *
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'fleets', FleetViewSet, basename='fleet')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register(r'maintenance-alerts', MaintenanceAlertViewSet, basename='maintenance-alert')


urlpatterns = [
    path('', include(router.urls)),
]
