import uuid
from django.db import transaction
from django.core.files.storage import default_storage
from rest_framework import serializers  # type: ignore
from rest_framework.serializers import ValidationError  # type: ignore
from dotenv import load_dotenv
from .tasks import upload_file


from .models import Fleet, Vehicle, VehicleStatusLog, FuelLog, MaintenanceAlert

class FleetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fleet
        fields = '__all__'

    def validate_name(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError("Fleet name is required.")
        
        return value

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

    def validate_fleet(self, value):
        if not value:
            raise ValidationError("Fleet is required.")
        return value
    
    def validate_license_plate(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError("License plate is required.")
        return value

    def validate_capacity_kg(self, value):
        if value is not None and value < 0:
            raise ValidationError("Capacity (kg) must be non-negative.")
        return value

    def validate_capacity_cubic_meters(self, value):
        if value is not None and value < 0:
            raise ValidationError("Capacity (cubic meters) must be non-negative.")
        return value

    def validate(self, attrs):
        # Ensure driver is in the same fleet if provided
        fleet = attrs.get('fleet')
        driver = attrs.get('driver')
        if driver and fleet and hasattr(driver, 'role') and driver.role != 'driver':
            raise ValidationError("Assigned driver must have role 'driver'.")
        
        return attrs

class VehicleStatusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleStatusLog
        fields = '__all__'

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in self.Meta.model.STATUS_CHOICES]
        if value and value not in valid_statuses:
            raise ValidationError(f"Status must be one of {valid_statuses}.")
        return value

class FuelLogSerializer(serializers.ModelSerializer):
    receipt_image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = FuelLog
        fields = '__all__'

    def create(self, validated_data):
        receipt_image = validated_data.pop('receipt_image', None)
        fuel_log = super().create(validated_data)

        if receipt_image:
            unique_filename = f"temp_{uuid.uuid4().hex}_{receipt_image.name}"
            temp_path = f"temp_uploads/{unique_filename}"
            file_path = default_storage.save(temp_path, receipt_image)

            upload_file.delay(temp_path, 'fuel_logs', fuel_log.id)

        return fuel_log

    def validate_liters(self, value):
        if value <= 0:
            raise ValidationError("Liters must be greater than zero.")
        return value

    def validate_cost(self, value):
        if value < 0:
            raise ValidationError("Cost cannot be negative.")
        return value

    def validate_odometer_reading_km(self, value):
        if value < 0:
            raise ValidationError("Odometer reading must be non-negative.")
            
        return value
    
    def validate_driver(self, value):
        if not value or not hasattr(value, 'role') or value.role != 'driver':
            raise ValidationError("Driver must have role 'driver'.")
        
    def validate_vehicle(self, value):
        if not value:
            raise ValidationError("Vehicle is required.")
        return value

    # def validate(self, attrs):

    #     if attrs.get('receipt_image'):
    #         file = attrs.pop('receipt_image')
    #         upload_file.delay(attrs['receipt_photo_url'], 'fuel_logs', str(obj.id), obj)
    #     return attrs


class MaintenanceAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceAlert
        fields = '__all__'

    def validate_alert_type(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError("Alert type is required.")
        return value

    def validate(self, attrs):
        # If resolved, resolved_at must be set
        if attrs.get('is_resolved') and not attrs.get('resolved_at'):
            raise ValidationError("resolved_at must be set if is_resolved is True.")
        return attrs