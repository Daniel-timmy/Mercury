import django_filters
from .models import Trip, LogSheet
from rest_framework import filters


class TripFilter(django_filters.FilterSet):
    class Meta:
        model = Trip
        fields = {
            'id': ['exact'],
            'manager': ['exact'],
            'driver': ['exact'],
            'destination': ['exact', 'icontains'],
            'start_date': ['exact', 'gte', 'lte', 'range'],
            'duration_days': ['exact', 'lt', 'gt', 'range'],
        }


class LogSheetFilter(django_filters.FilterSet):
    class Meta:
        model = LogSheet
        fields = {
            'id': ['exact'],
            'driver': ['exact'],
            'shipper': ['exact', 'icontains'],
            'date': ['exact', 'gte', 'lte', 'range'],
            'trip': ['exact'],
            'vehicle_no': ['exact', 'icontains'],
            'commodity': ['exact', 'icontains'],
        }


class IsOwnerFilterBackend(filters.BaseFilterBackend):

    def filter_queryset(self, request, queryset, view):
        return queryset.filter(user=request.user)
