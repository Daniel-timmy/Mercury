import django_filters
from .models import Fleet, Vehicle, VehicleStatusLog
from rest_framework import filters


class FleetFilter(django_filters.FilterSet):
    class Meta:
        model = Fleet
        fields = {
            'id': ['exact'],
            'manager': ['exact'],
            'name': ['exact', 'icontains'],
        }

class VehicleFilter(django_filters.FilterSet):
    class Meta:
        model = Vehicle
        fields = {
            'id': ['exact'],
            'fleet': ['exact'],
            'driver': ['exact'],
            'license_plate': ['exact', 'icontains'],
            'vehicle_type': ['exact', 'icontains'],
            'fuel_type': ['exact'],
            'ownership_status': ['exact'],
            'is_active': ['exact'],
        }
