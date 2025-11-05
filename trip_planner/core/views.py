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
from django_filters.rest_framework import DjangoFilterBackend
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
# from django.contrib.gis.geos import Point
import logging

from .models import DriverPosition, LogSheet, LogEntry, Trip
from .serializers import DriverPositionSerializer, LogSheetSerializer, LogEntrySerializer, TripSerializer
from .filters import TripFilter, LogSheetFilter, LogEntryFilter
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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['destination']
    ordering_fields = ['start_date', 'duration_days']

    def get_queryset(self) -> QuerySet[Trip]:  
        user = self.request.user
        if type(user) != User:
            return Trip.objects.none()
        if user.role == 'driver':
            return Trip.objects.filter(driver=user).order_by('-created_at')
        elif user.role in ['admin']:
            return Trip.objects.all().order_by('-created_at')
        elif user.role == 'manager':
            return Trip.objects.filter(manager=user).order_by('-created_at')
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
        if trip.manager == user or trip.driver == user:
            return super().update(request, *args, **kwargs)
        return Response({'detail': 'Only manager or assigned driver can update trips.'}, status=status.HTTP_403_FORBIDDEN)
    
        
    def partial_update(self, request, *args, **kwargs):
        user = request.user
        trip = self.get_object()
        if trip.manager != user and trip.driver != user:
            return Response({'detail': 'Only manager or admin can update trips.'}, status=status.HTTP_403_FORBIDDEN)

        return super().partial_update(request, *args, **kwargs)

class LogSheetViewSet(ModelViewSet):
    """ViewSet for LogSheet operations."""
    serializer_class = LogSheetSerializer
    queryset = LogSheet.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    filterset_class = LogSheetFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shipper', 'commodity', 'vehicle_no']
    ordering_fields = ['date', 'total_mileage']

    
    def get_queryset(self):
        user = self.request.user
        if not isinstance(user, User):
            return LogSheet.objects.none()

        queryset = super().get_queryset()  # Let filters apply first

        if user.role == 'admin':
            pass  # all
        elif user.role == 'driver':
            queryset = queryset.filter(driver=user)
        elif user.role == 'manager':
            queryset = queryset.filter(trip__manager=user)
        else:
            return LogSheet.objects.none()

        return queryset.order_by('-created_at')

    
    def create(self, request, *args, **kwargs):
        
        driver = request.user
        if type(driver) != User or driver.role != 'driver':
            return Response({'detail': 'Only authenticated drivers can create logsheets.'}, status=status.HTTP_403_FORBIDDEN)
        trip_id = request.data.get('trip')
        trip = Trip.objects.filter(id=trip_id).first()
        if not trip:
            return Response({'detail': 'Trip does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        if trip.driver != driver:
            return Response({'detail': 'You can only create logsheets for your own trips.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class LogEntryViewSet(ModelViewSet):
    """ViewSet for LogEntry operations."""
    serializer_class = LogEntrySerializer
    queryset = LogEntry.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    filterset_class = LogEntryFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['location', 'duty_status']
    ordering_fields = ['start_time', 'duration']

    def get_queryset(self):
        user = self.request.user
        if type(user) != User:
            return LogEntry.objects.none()
        
        logsheet_id = self.request.GET.get('logsheet')
        if not logsheet_id:
            return LogEntry.objects.none()
     
        
        return super().get_queryset().order_by('start_time')
    
    def create(self, request, *args, **kwargs):
        user = request.user
        if type(user) != User:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        logsheet_id = request.data.get('log_id')
        if not logsheet_id:
            return Response({'detail': 'log_id field is required.'}, status=status.HTTP_400_BAD_REQUEST)
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

class DriverPositionViewSet(ModelViewSet):
    """
    ViewSet for managing Driver Positions.
    Provides CRUD operations for DriverPosition model.
    Only authenticated users can access this endpoint.
    """
    queryset = DriverPosition.objects.all()
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend]
    serializer_class = DriverPositionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:

            super().create(request, *args, **kwargs)

            manager_id = request.user.manager.id
            print("Manager ID for DriverPosition notification:", manager_id)
            group_name = f'manager_{manager_id}'
            channel_layer = get_channel_layer()

            if not channel_layer:
                logger.error("Channel layer is not configured.")
                return Response({'detail': 'Internal server error. Channel layer is not available.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
            if request.data.get('latitude') is None or request.data.get('longitude') is None:
                raise ValueError("Latitude or Longitude is missing in the request data.")
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'position_update',
                    'data': {
                        'driver_id': str(request.user.id),
                        'name': request.user.name,
                        'lat': request.data.get('latitude'),
                        'lon': request.data.get('longitude'),
                        'timestamp': request.data.get('timestamp').format()
                    }
                }
            )
        except ValueError as ve:
            logger.error(f"Invalid data provided for DriverPosition: {ve}")
            return Response({'detail': 'Invalid data provided.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Failed to send position update via channel layer: {e}")
            # Optionally, include a warning in the response
            return Response(
                {
                    'warning': 'Position saved, but notification failed (Redis connection error).'
                },
                status=status.HTTP_201_CREATED
            )
        return Response(status=status.HTTP_201_CREATED)
