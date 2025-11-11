import uuid
from django.db import models
from django.conf import settings


class Fleet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    manager = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='fleets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
         return self.name

class Vehicle(models.Model):

    FUEL_TYPE_CHOICES = [
        ('Diesel', 'Diesel'),
        ('Petrol', 'Petrol'),
        ('Electric', 'Electric'),
    ]
    OWNERSHIP_STATUS_CHOICES = [
        ('Owned', 'Owned'),
        ('Leased', 'Leased'),
        ('Contract', 'Contract'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fleet = models.OneToOneField(Fleet, on_delete=models.CASCADE, related_name='vehicles')
    driver = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    license_plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50)  
    capacity_kg = models.IntegerField(null=True, blank=True)
    capacity_cubic_meters = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES, default='Diesel')
    ownership_status = models.CharField(max_length=20, choices=OWNERSHIP_STATUS_CHOICES, default='Owned')
    current_mileage_km = models.IntegerField(default=0)
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_due_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.license_plate} ({self.vehicle_type})"

class VehicleStatusLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    STATUS_CHOICES = [
        ('Moving', 'Moving'),
        ('Stopped', 'Stopped'),
        ('Idle', 'Idle'),
        ('Offline', 'Offline'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='status_logs')
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)
    # battery_level = models.IntegerField(null=True, blank=True)  # Phone battery % (from driver app)
    recorded_at = models.DateTimeField(auto_now_add=True)

class FuelLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    liters = models.DecimalField(max_digits=6, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_reading_km = models.IntegerField()
    fuel_station_name = models.CharField(max_length=100, null=True, blank=True)
    receipt_photo_url = models.TextField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

class MaintenanceAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_alerts')
    alert_type = models.CharField(max_length=50)  # 'Oil Change', 'Tire Rotation', etc.
    # due_at_km = models.IntegerField(null=True, blank=True)
    # due_at_date = models.DateField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
