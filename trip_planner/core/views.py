"""
Core views for handling LogSheet and LogEntry operations.
This module provides ViewSets for CRUD operations on driver logs.
"""


from django.db.models import QuerySet
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework import filters
import logging

from .models import LogSheet, LogEntry, Trip
from .serializers import LogSheetSerializer, LogEntrySerializer, TripSerializer
from .filters import TripFilter, LogSheetFilter
from user.models import User

logger = logging.getLogger(__name__)


class TripViewSet(ModelViewSet):
    """
    ViewSet for Trip operations.
    Only managers can create trips.
    Drivers can only update trip status from pending to in progress.
    Admins have full access.
    """
    serializer_class = TripSerializer
    queryset = Trip.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    filterset_class = TripFilter
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['destination']
    ordering_fields = ['start_date', 'duration_days']

    def get_queryset(self) -> QuerySet[Trip]:  
        user = self.request.user
        if type(user) != User:
            return Trip.objects.none()
        if user.role == 'driver':
            return Trip.objects.filter(driver=user)
        elif user.role in ['admin']:
            return Trip.objects.all()
        elif user.role == 'manager':
            return Trip.objects.filter(manager=user)
        return Trip.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if type(user) != User:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.role != 'manager':
            return Response({'detail': 'Only managers can create trips.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        trip = self.get_object()
        if user.role == 'manager':
            return super().update(request, *args, **kwargs)
        if user.role == 'driver':
            # Only allow driver to update status from pending to in progress
            status_field = request.data.get('status')
            allowed_statuses = ['pending', 'in_progress']
            if status_field not in allowed_statuses:
                return Response({'detail': 'Driver can only update status to in_progress.'}, status=status.HTTP_403_FORBIDDEN)
            if trip.driver != user:
                return Response({'detail': 'You can only update your own trips.'}, status=status.HTTP_403_FORBIDDEN)
            return super().update(request, *args, **kwargs)
        return Response({'detail': 'Only manager or assigned driver can update trips.'}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

class LogSheetViewSet(ModelViewSet):
    """ViewSet for LogSheet operations."""
    serializer_class = LogSheetSerializer
    queryset = LogSheet.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    filterset_class = LogSheetFilter
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shipper', 'commodity', 'vehicle_no']
    ordering_fields = ['date', 'total_mileage']

    def get_queryset(self):
        user = self.request.user
        if type(user) != User:
            return LogEntry.objects.none()
        if user.role == 'admin':
            return LogSheet.objects.all().order_by('-created_at')
        elif user.role == 'driver':
            return LogSheet.objects.filter(driver=user).order_by('-created_at')
        elif user.role == 'manager':
            return LogSheet.objects.filter(trip__manager=user).order_by('-created_at')
        return LogSheet.objects.none()

class LogEntryViewSet(ModelViewSet):
    """ViewSet for LogEntry operations."""
    serializer_class = LogEntrySerializer
    queryset = LogEntry.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['location', 'duty_status']
    ordering_fields = ['start_time', 'duration']

    def get_queryset(self):
        user = self.request.user
        logsheet_id = self.request.GET.get('log_id')
        if type(user) != User:
            return LogEntry.objects.none()
        if not logsheet_id:
            return LogEntry.objects.none()
        base_qs = LogEntry.objects.filter(logsheet__id=logsheet_id)
        
        return base_qs.order_by('start_time')
    
    def create(self, request, *args, **kwargs):
        user = request.user
        if type(user) != User:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        logsheet_id = request.data.get('logsheet')
        if not logsheet_id:
            return Response({'detail': 'logsheet field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            logsheet = LogSheet.objects.get(id=logsheet_id)
        except LogSheet.DoesNotExist:
            return Response({'detail': 'LogSheet does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.role == 'driver':
            if logsheet.driver != user:
                return Response({'detail': 'You can only add entries to your own logsheets.'}, status=status.HTTP_403_FORBIDDEN)
            return super().create(request, *args, **kwargs)
        return Response({'detail': 'Only drivers can create log entries.'}, status=status.HTTP_403_FORBIDDEN)
    
    def update(self, request, *args, **kwargs):
        return Response({'detail': 'You cannot update log entries once created.'}, status=status.HTTP_403_FORBIDDEN)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'detail': 'You cannot update log entries once created.'}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'driver':
            return Response({'detail': 'Only drivers can delete log entries.'}, status=status.HTTP_403_FORBIDDEN)
        log_entry = self.get_object()
        if log_entry.logsheet.driver != request.user:
            return Response({'detail': 'You can only delete your own log entries.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
