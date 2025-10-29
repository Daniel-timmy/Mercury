from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer


class DriverViewSet(ModelViewSet):
    """
    ViewSet for managing Driver users.
    Provides CRUD operations for users with the 'driver' role.
    Only admin and manager users can create, update, or delete drivers.
    """
    queryset = User.objects.filter(role='driver')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser | IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can create drivers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can update drivers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can update drivers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can delete drivers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
class ManagerViewSet(ModelViewSet):
    """
    ViewSet for managing Manager users.
    Provides CRUD operations for users with the 'manager' role.
    Only admin users can create, update, or delete managers.
    """
    queryset = User.objects.filter(role='manager')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only authenticated admin can create managers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can update managers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'manager']:
            return Response({'detail': 'Only authenticated admin or manager can update managers.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.id != self.get_object().id and request.user.role != 'admin':
            return Response({'detail': 'Managers can only update their own profile.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only authenticated admin can delete managers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
class AdminViewSet(ModelViewSet):
    """
    ViewSet for managing Admin users.
    Provides CRUD operations for users with the 'admin' role.
    Only admin users can create, update, or delete other admins.
    """
    queryset = User.objects.filter(role='admin')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = []
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        if request.data.get('access_key') != 'SECRET_ADMIN_KEY':
            return Response({'detail': 'Invalid access key for creating admin.'}, status=status.HTTP_403_FORBIDDEN)

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only authenticated admin can update admins.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only authenticated admin can update admins.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only authenticated admin can delete admins.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
