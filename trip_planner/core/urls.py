from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogSheetViewSet, LogEntryViewSet

router = DefaultRouter()
router.register(r'logsheets', LogSheetViewSet, basename='logsheets')
router.register(r'logentries', LogEntryViewSet, basename='logentries')

urlpatterns = [
    path('', include(router.urls)),
]   