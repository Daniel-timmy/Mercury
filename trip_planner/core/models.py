"""Core models for the trip planner application."""
from datetime import time
import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class LogSheet(models.Model):
    """Model for tracking driver's daily log sheets and route information."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic information
    driver = models.CharField(max_length=100)
    shipper = models.CharField(max_length=255)
    commodity = models.CharField(max_length=255)
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
    current_location = models.CharField(max_length=200)
    pickup_location = models.CharField(max_length=200)
    dropoff_location = models.CharField(max_length=200)
    start_coords = models.JSONField(default=dict) # type: ignore
    pickup_coords = models.JSONField(default=dict) # type: ignore
    end_coords = models.JSONField(default=dict) # type: ignore
    stops = models.JSONField(default=list) # type: ignore

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

    def __str__(self) -> str:
        """Return string representation of LogEntry."""
        return f"{self.logsheet.driver} - {self.duty_status} - {self.date}"