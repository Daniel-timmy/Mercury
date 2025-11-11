from django.db.models import QuerySet
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from user.models import User
from .models import Fleet, Vehicle, VehicleStatusLog, FuelLog, MaintenanceAlert
from .serializers import FleetSerializer, VehicleSerializer, VehicleStatusLogSerializer, FuelLogSerializer, MaintenanceAlertSerializer
from .filters import FleetFilter, VehicleFilter
# Create your views here.


class FleetViewSet(ModelViewSet):
    queryset = Fleet.objects.all()
    serializer_class = FleetSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = FleetFilter
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']

    def get_queryset(self) -> QuerySet:
        """Limit fleets to those managed by the authenticated user."""
        user = self.request.user
        if type(user) != User:
            return Fleet.objects.none()
        if user.role == 'admin':
            return self.queryset
        elif user.role == 'manager':
            return self.queryset.filter(manager=user)
        return Fleet.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admin can create fleets.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admin can update fleets.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admin can delete fleets.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class VehicleViewSet(ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = VehicleFilter
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if type(user) != User:
            return Vehicle.objects.none()
        if user.role == 'admin':
            return self.queryset
        elif user.role == 'manager':
            return self.queryset.filter(fleet__manager=user)
        elif user.role == 'driver':
            return self.queryset.filter(driver=user)
        return Vehicle.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only admin or manager can create vehicles.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if user.role == 'admin':
            return super().update(request, *args, **kwargs)
        elif user.role == 'manager':
            if hasattr(instance, 'fleet') and instance.fleet.manager == user:
                return super().update(request, *args, **kwargs)
            return Response({'detail': 'Managers can only update vehicles in their own fleet.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({'detail': 'Only admin or manager can update vehicles.'}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()
        if user.role == 'admin':
            return super().destroy(request, *args, **kwargs)
        elif user.role == 'manager':
            if hasattr(instance, 'fleet') and instance.fleet.manager == user:
                return super().destroy(request, *args, **kwargs)
            return Response({'detail': 'Managers can only delete vehicles in their own fleet.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({'detail': 'Only admin or manager can delete vehicles.'}, status=status.HTTP_403_FORBIDDEN)

class FuelLogViewSet(ModelViewSet):
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if type(user) != User:
            return FuelLog.objects.none()
        if user.role == 'driver':
            return self.queryset.filter(driver=user)
        elif user.role in ['manager', 'admin']:
            return self.queryset
        return FuelLog.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'driver':
            return Response({'detail': 'Only drivers can create fuel logs.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return Response({'detail': 'Fuel logs cannot be updated.'}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'Fuel logs cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)

class MaintenanceAlertViewSet(ModelViewSet):
    queryset = MaintenanceAlert.objects.all()
    serializer_class = MaintenanceAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if type(user) != User:
            return MaintenanceAlert.objects.none()
        if user.role == 'driver':
            return self.queryset.filter(vehicle__fuel_logs__driver=user)
        elif user.role in ['manager', 'admin']:
            return self.queryset
        return MaintenanceAlert.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'driver':
            return Response({'detail': 'Only drivers can create maintenance alerts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'driver':
            return Response({'detail': 'Only drivers can update maintenance alerts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'Maintenance alerts cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)

