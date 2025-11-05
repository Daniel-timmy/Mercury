import django_filters
from .models import Trip, LogSheet, LogEntry
from rest_framework import filters


class TripFilter(django_filters.FilterSet):
    class Meta:
        model = Trip
        fields = {
            'id': ['exact'],
            'manager': ['exact'],
            'driver': ['exact'],
            'start_date': ['exact', 'gte', 'lte', 'range'],
            'duration_days': ['exact', 'lt', 'gt', 'range'],
            'shipper': ['exact', 'icontains'],
            'commodity': ['exact', 'icontains'],
        }


class LogSheetFilter(django_filters.FilterSet):
    class Meta:
        model = LogSheet
        fields = {
            'id': ['exact'],
            'driver': ['exact'],
            
            'date': ['exact', 'gte', 'lte', 'range'],
            'trip': ['exact'],
            'vehicle_no': ['exact', 'icontains'],
        }

class LogEntryFilter(django_filters.FilterSet):
    class Meta:
        model = LogEntry
        fields = {
            'id': ['exact'],
            'logsheet': ['exact'],
            'activity': ['exact', 'icontains'],

        }


class IsOwnerFilterBackend(filters.BaseFilterBackend):

    def filter_queryset(self, request, queryset, view):
        return queryset.filter(user=request.user)
