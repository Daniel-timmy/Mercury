"""Core models for the trip planner application."""
from datetime import time
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
# from django.contrib.gis.db import models as gis_models



class Trip(models.Model):
    """Model for tracking trips assigned to drivers and managed by managers."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='managed_trips'
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        null=False,
        blank=False,
        related_name='driver_trips'
    )
    start_location = models.CharField(max_length=200, null=False, blank=False)
    pickup_location = models.CharField(max_length=200, null=False, blank=False)
    dropoff_location = models.CharField(max_length=200, null=False, blank=False)
    start_coords = models.JSONField(default=dict, null=False, blank=False) # type: ignore
    pickup_coords = models.JSONField(default=dict, null=False, blank=False) # type: ignore
    end_coords = models.JSONField(default=dict, null=False, blank=False) # type: ignore
    stops = models.JSONField(default=list, null=False, blank=False) # type: ignore
    total_mileage = models.IntegerField(default=0)
    start_date = models.DateField()
    status = models.CharField(max_length=50, choices=[
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ], default='pending')
    shipper = models.CharField(max_length=255, null=False, blank=False)
    commodity = models.CharField(max_length=255, null=False, blank=False)
    duration_days = models.PositiveIntegerField(null=False, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self) -> str:
        """Return string representation of Trip."""
        return f"Trip to {self.dropoff_location} created by {self.manager.name}"


class LogSheet(models.Model):
    """Model for tracking driver's daily log sheets and route information."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='logs',
        null=False,
    )

    # Basic information
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=False,
        related_name='driver_logsheets'
    )

    remarks = models.CharField(default="No Remarks", max_length=10000)

    # Vehicle information
    vehicle_no = models.CharField(max_length=100)
    trailer_no = models.CharField(max_length=100, blank=True, null=True)
    total_mileage = models.IntegerField(default=0)

    # Timestamps and dates
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    on_duty_start_time = models.TimeField(null=True)

    # HOS tracking fields
    off_duty = models.FloatField(default=0.0)
    on_duty = models.FloatField(default=0.0)
    berth = models.FloatField(default=0.0)
    driving = models.FloatField(default=0.0)
    current_cycle_hours = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(70)]
    )

    # Location tracking
    start_location = models.CharField(max_length=200)

    start_coords = models.JSONField(default=dict) # type: ignore


    def __str__(self) -> str:
        """Return string representation of LogSheet."""
        return f"{self.driver}'s log - {self.date}"


class LogEntry(models.Model):
    """Model for tracking individual driver activities and status changes."""

    DUTY_STATUS_CHOICES = [
        ("off_duty", "Off Duty"),
        ("sleeper", "Sleeper"),
        ("driving", "Driving"),
        ("on_duty", "On Duty"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    logsheet = models.ForeignKey(LogSheet, on_delete=models.CASCADE)

    # Location information
    lat = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    long = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    location = models.CharField(max_length=255)

    # Time tracking
    start_time = models.TimeField(
        blank=False,
        null=False,
        default=time(0, 0, 0),
    )
    end_time = models.TimeField(
        blank=False,
        null=False,
        default=time(0, 0, 0),
    )
    duration = models.FloatField(default=0.0)
    date = models.DateField(auto_now_add=True)

    # Status and activity
    duty_status = models.CharField(
        max_length=20,
        choices=DUTY_STATUS_CHOICES,
    )
    activity = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        """Return string representation of LogEntry."""
        return f"{self.logsheet.driver} - {self.duty_status} - {self.date}"
    
class DriverPosition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=False,
        related_name='driver_positions'
    )
    # location = gis_models.PointField(null=False)
    # trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    position_coords = models.JSONField(default=dict, null=False, blank=False) # type: ignore
    
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']