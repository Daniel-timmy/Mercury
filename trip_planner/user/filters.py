import django_filters
from .models import User
from rest_framework import filters


class UserFilter(django_filters.FilterSet):
    class Meta:
        model = User
        fields = {
            'id': ['exact'],
            'name': ['exact', 'icontains'],
            'email': ['exact', 'icontains'],
            'role': ['exact'],
            'manager': ['exact'],
            'created_at': ['exact', 'date__range'],
        }