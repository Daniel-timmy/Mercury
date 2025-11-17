import django_filters
from .models import Fleet, Vehicle, VehicleStatusLog, FuelLog,  MaintenanceAlert
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

class FuelLogFilter(django_filters.FilterSet):
    class Meta:
        model = FuelLog
        fields = {
            'id': ['exact'],
            'vehicle': ['exact'],
            'driver': ['exact'],
            'logged_at': ['exact', 'gte', 'lte'],
        }

class MaintenanceAlertFilter(django_filters.FilterSet):
    class Meta:
        model = MaintenanceAlert
        fields = {
            'id': ['exact'],
            'vehicle': ['exact'],
            'alert_type': ['exact', 'icontains'],
            'is_resolved': ['exact'],
            'created_at': ['exact', 'gte', 'lte'],
            'resolved_at': ['exact', 'gte', 'lte'],
        }