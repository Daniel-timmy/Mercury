"""
Core views for handling LogSheet and LogEntry operations.
This module provides ViewSets for CRUD operations on driver logs.
"""


from django.db.models import QuerySet
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
import logging

from .models import LogSheet, LogEntry
from .serializers import LogSheetSerializer, LogEntrySerializer

logger = logging.getLogger(__name__)


class LogSheetViewSet(ModelViewSet):
    """ViewSet for LogSheet operations.
    
    Handles all CRUD operations for LogSheets with proper
    validation and HOS tracking.
    """
    serializer_class = LogSheetSerializer
    queryset = LogSheet.objects.all()
    lookup_field = 'id'

    def get_queryset(self) -> QuerySet[LogSheet]:
        """Filter LogSheets based on date parameter if provided."""
        queryset = super().get_queryset().order_by('-created_at')
        date = self.request.query_params.get('date')
        logger.debug("LogSheetViewSet.get_queryset called with date=%s", date)
        if date:
            queryset = queryset.filter(date=date)
        return queryset


class LogEntryViewSet(ModelViewSet):
    """ViewSet for LogEntry operations.
    
    Handles all CRUD operations for LogEntries with HOS validation.
    """
    serializer_class = LogEntrySerializer
    queryset = LogEntry.objects.all()

    def get_queryset(self) -> QuerySet[LogEntry]:
        """Filter LogEntries by logsheet_id from query parameters."""
        queryset = super().get_queryset()
        logsheet_id = self.request.query_params.get('log_id')
        logger.debug("LogEntryViewSet.get_queryset called with log_id=%s", logsheet_id)
        if not logsheet_id:
            logger.info("No log_id provided to LogEntryViewSet.get_queryset, returning empty queryset")
            return queryset.none()

        return queryset.filter(logsheet__id=logsheet_id).order_by('start_time')