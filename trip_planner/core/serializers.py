from typing import Any, Dict, List, Tuple
from datetime import datetime, timedelta, time
import re
import logging
import time as _time
import os

from django.db import transaction
from rest_framework import serializers  # type: ignore
from rest_framework.serializers import ValidationError  # type: ignore
from dotenv import load_dotenv

from trip_planner.user.models import User

from .models import LogEntry, LogSheet, Trip
from .utils import geocode_address, get_route, hos_checker
from .constants import (
    PICKUP_DROPOFF_HOURS,
    FUELING_INTERVAL_MILES,
    DAILY_DRIVING_LIMIT,
    DAILY_ON_DUTY_LIMIT,
)

load_dotenv()

API_KEY1: str | None = os.environ.get('API_KEY1')
API_KEY2: str | None = os.environ.get('API_KEY2')

logger = logging.getLogger(__name__)

class TripSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and managing trips.
    Handles assignment of manager and driver, and trip details.
    """
    manager = serializers.PrimaryKeyRelatedField(queryset=Trip._meta.get_field('manager').related_model.objects.filter(role='manager'))
    driver = serializers.PrimaryKeyRelatedField(queryset=Trip._meta.get_field('driver').related_model.objects.filter(role='driver'), required=False, allow_null=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "manager",
            "driver",
            "start_location",
            "pickup_location",
            "dropoff_location",
            "start_coords",
            "pickup_coords",
            "end_coords",
            "stops",
            "total_mileage",
            "start_date",
            "duration_days",
            "status",
            "shipper",
            "commodity"
        ]
        read_only_fields = ["id", "stops", "start_coords", "pickup_coords", "end_coords", "total_mileage"]

    def _calculate_stops(self, data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], float]:
        cur = data["_start_coords"]
        pic = data["_pickup_coords"]
        end = data["_end_coords"]

        # leg 1: start → pickup (skip if same address)
        leg1 = (
            get_route((cur["latitude"], cur["longitude"]),
                      (pic["latitude"], pic["longitude"]))
            if data["start_location"].strip() != data["pickup_location"].strip()
            else {"distance": 0, "duration": 0}
        )
        leg2 = get_route((pic["latitude"], pic["longitude"]),
                         (end["latitude"], end["longitude"]))

        total_distance = leg1["distance"] + leg2["distance"]
        logger.info("Total distance %.2f miles (leg1=%.2f, leg2=%.2f)",
                    total_distance, leg1["distance"], leg2["distance"])

        # Fueling stops
        fueling: List[Dict[str, Any]] = []
        if total_distance > FUELING_INTERVAL_MILES:
            stops_needed = int(total_distance // FUELING_INTERVAL_MILES)
            for i in range(stops_needed):
                fueling.append({
                    "type": "fueling",
                    "location": data["pickup_location"] if i == 0 else data["dropoff_location"],
                    "distance": (i + 1) * FUELING_INTERVAL_MILES,
                })

        stops: List[Dict[str, Any]] = [
            {"type": "pickup",  "location": data["pickup_location"],
             "duration_hours": PICKUP_DROPOFF_HOURS},
            *fueling,
            {"type": "dropoff", "location": data["dropoff_location"],
             "duration_hours": PICKUP_DROPOFF_HOURS},
        ]
        return stops, total_distance

    def create(self, validated_data: Dict[str, Any]) -> Trip:
        """
        Creates a new Trip instance.

        Args:
            validated_data: Dictionary containing trip creation data

        Returns:
            Trip: Created trip instance

        Raises:
            ValidationError: If creation fails
        """
        # Extract and validate location data
        start_address: str = validated_data["start_location"]
        dropoff_address: str = validated_data["dropoff_location"]
        pickup_location: str = validated_data["pickup_location"]

        try:
            validated_data['_start_coords'] = geocode_address(validated_data["start_location"], API_KEY1)
            validated_data['_pickup_coords'] = geocode_address(validated_data["pickup_location"], API_KEY2)
            validated_data['_end_coords'] = geocode_address(validated_data["dropoff_location"], API_KEY1)
        except ValidationError as e:
            raise
        except Exception as e:
            raise ValidationError({
                "error": "Address validation failed",
                "success": False,
                "msg": str(e),
            })


        start_coords = validated_data['_start_coords']
        end_coords = validated_data['_end_coords']
        pickup_coords = validated_data['_pickup_coords'] 

        # Calculate multi-leg route distances
        stops, total_distance = self._calculate_stops(validated_data)

        try:
            with transaction.atomic():
                trip = Trip.objects.create(
                     manager=validated_data["manager"],
                     driver=validated_data.get("driver", None),
                     start_location=start_address,
                     pickup_location=pickup_location,
                     dropoff_location=dropoff_address,
                     start_coords=start_coords,
                     end_coords=end_coords,
                     pickup_coords=pickup_coords,
                     stops=stops,
                     total_mileage=total_distance,
                     start_date=validated_data["start_date"],
                     duration_days=validated_data["duration_days"],
                     status=validated_data.get("status", "pending"),
                     shipper=validated_data["shipper"],
                     commodity=validated_data["commodity"],
                )
                trip.save()
                logger.info(
                    "Created Trip id=%s manager=%s driver=%s destination=%s start_date=%s",
                    trip.id,
                    trip.manager,
                    trip.driver,
                    trip.dropoff_location,
                    trip.start_date,
                )
                return trip
        except Exception as e:
            logger.exception("Error creating Trip (manager=%s driver=%s): %s", validated_data.get("manager"), validated_data.get("driver"), e)
            raise ValidationError({
                "error": "Error creating Trip",
                "success": False,
                "msg": str(e),
            })
    
    def update(self, instance, validated_data):
        address_fields = {"start_location", "pickup_location", "dropoff_location"}
        address_updated = address_fields & validated_data.keys()

        if address_updated and not address_fields.issubset(validated_data):
            raise ValidationError("All three address fields required to update locations.")

        with transaction.atomic():
            for field in ["manager", "driver", "start_date", "duration_days", "status", "shipper", "commodity"]:
                if field in validated_data:
                    setattr(instance, field, validated_data[field])
            stops, total_mileage = self._calculate_stops(validated_data)
            if address_updated:
                # Geocode + update
                validated_data['_start_coords'] = geocode_address(validated_data["start_location"], API_KEY1)
                validated_data['_pickup_coords'] = geocode_address(validated_data["pickup_location"], API_KEY2)
                validated_data['_end_coords'] = geocode_address(validated_data["dropoff_location"], API_KEY1)

                instance.start_location = validated_data["start_location"]
                instance.pickup_location = validated_data["pickup_location"]
                instance.dropoff_location = validated_data["dropoff_location"]
                instance.start_coords = validated_data["_start_coords"]
                instance.pickup_coords = validated_data["_pickup_coords"]
                instance.end_coords = validated_data["_end_coords"]
                instance.stops = stops
                instance.total_mileage = total_mileage

            instance.save()
        return instance

    def validate_manager(self, value):
        if value:
            if value.role != 'manager':
                raise ValidationError("Manager must have role 'manager'.")
        else:
            raise ValidationError("Manager is required.")
        return value

    def validate_driver(self, value):
        if value:
            if value.role != 'driver':
                raise ValidationError("Driver must have role 'driver'.")
        return value

    def validate_status(self, value):
        valid_statuses = ['pending', 'in_progress', 'completed']
        if value not in valid_statuses:
            raise ValidationError(f"Status must be one of {valid_statuses}.")
        return value
    
    def validate_pickup_location(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": f"{value} is required and must be a string.",
            })
        return value

    def validate_dropoff_location(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": f"{value} is required and must be a string.",
            })
        return value

    def validate_start_location(self, value):
        if not value or len(value.strip()) == 0:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": f"{value} is required and must be a string.",
            })
        return value

    

class LogSheetSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and managing driver log sheets.
    Handles route planning, fueling stops, and basic log sheet operations.
    """
    trip = serializers.PrimaryKeyRelatedField(queryset=Trip.objects.all())
    driver = serializers.PrimaryKeyRelatedField(queryset=LogSheet._meta.get_field('driver').related_model.objects.filter(role='driver'), required=False, allow_null=True)

    class Meta:
        model = LogSheet
        fields = [
            "id",
            "trip",
            "date",
            "berth",
            "on_duty",
            "off_duty",
            "driving",
            "on_duty_start_time",
            "driver",

            "current_location",
      
            "total_mileage",

            "vehicle_no",
            "trailer_no",
     
            "current_cycle_hours",
            "created_at",

            "start_coords",
     
    
             ]
        read_only_fields = [
            "id",
            "date",
            "berth",
            "on_duty",
            "off_duty",
            "driving",
            "on_duty_start_time",
            "start_coords",
        ]

    def create(self, validated_data: Dict[str, Any]) -> LogSheet:
        """
        Creates a new LogSheet with route planning and fueling stops calculation.

        Args:
            validated_data: Dictionary containing logsheet creation data

        Returns:
            LogSheet: Created logsheet instance

        Raises:
            ValidationError: If logsheet already exists or creation fails
        """
        start_perf = _time.perf_counter()
        logger.debug(
            "LogSheet.create called: driver=%s vehicle_no=%s start=%s ",
            validated_data.get("driver"),
            validated_data.get("vehicle_no"),
            validated_data.get("start_location"),
        )


        # Extract and validate location data
        current_address: str = validated_data["start_location"]

        try:
            tx_start = _time.perf_counter()
            with transaction.atomic():
                # Create logsheet with all route and stop information
                logsheet = LogSheet.objects.create(
                   driver=validated_data.get("driver", "Driver"),

                   vehicle_no=validated_data["vehicle_no"],
                   trailer_no=validated_data.get("trailer_no", ""),

                   start_location=current_address,
                   start_coords=geocode_address(current_address, API_KEY1),
                   
                   current_cycle_hours=validated_data["current_cycle_hours"],
                   trip=validated_data["trip"],
                )
                logsheet.save()
                tx_elapsed = _time.perf_counter() - tx_start
                total_elapsed = _time.perf_counter() - start_perf
                logger.info(
                    "Created LogSheet id=%s driver=%s tx_time=%.4fs total_time=%.4fs",
                    logsheet.id,
                    logsheet.driver,
                    tx_elapsed,
                    total_elapsed,
                )
                return logsheet
        except Exception as e:
            logger.exception("Error creating LogSheet (driver=%s vehicle_no=%s): %s", validated_data.get("driver"), validated_data.get("vehicle_no"), e)
            raise ValidationError({
                "error": "Error creating LogSheet",
                "success": False,
                "msg": str(e),
            })
        
    def validate_trip(self, value: Trip) -> Trip:
        if value:
            return value
        else:
            raise ValidationError("Trip is required.")
    
    def validate_start_location(self, value: str) -> str:
        if not value or len(value.strip()) == 0:
            raise ValidationError("Start location is required.")
        return value

    def validate_driver(self, value: User) -> User:
        if value:
            if value.role != 'driver':
                raise ValidationError("Driver must have role 'driver'.")
        return value


class LogEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for creating and managing individual log entries.
    Handles HOS (Hours of Service) compliance and duty status tracking.
    """

    log_id = serializers.CharField(write_only=True, required=False)
    span = serializers.CharField(write_only=True, required=True)
    startTime = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "logsheet",
            "start_time",
            "end_time",
            "lat",
            "long",
            "location",
            "duration",
            "duty_status",
            "activity",
            "log_id",
            "span",
            "startTime",
        ]
        read_only_fields = ["id", "logsheet", "duration", "start_time", "end_time", "long", "lat"]

    def create(self, validated_data: Dict[str, Any]) -> LogEntry:
        """
        Creates a new LogEntry with HOS validation and duty status updates.

        Args:
            validated_data: Dictionary containing log entry data

        Returns:
            LogEntry: Created log entry instance

        Raises:
            ValidationError: If HOS rules are violated or creation fails
        """
        start_perf = _time.perf_counter()
        logger.debug("LogEntry.create called: log_id=%s duty_status=%s activity=%s", validated_data.get("log_id"), validated_data.get("duty_status"), validated_data.get("activity"))


        try:
            with transaction.atomic():
                # Validate logsheet existence
                logsheet = validated_data["_logsheet_obj"]
                # Get location coordinates and calculate duration
                location_coords = validated_data["_location_coords"]
                logger.debug("Geocode log entry location=%s -> %s", validated_data["location"], location_coords)

                # Run HOS checker before creation
            
                computed_value: Dict[str, Any]  = validated_data["_computed"] 
                start_time = computed_value["start_time"]
                end_time = computed_value["end_time"]
                duration = computed_value["duration"]
                logger.debug("Computed values - start_time=%s end_time=%s duration=%.2f", start_time, end_time, float(duration))
                # Create log entry
                logentry = LogEntry.objects.create(
                    logsheet=logsheet,
                    lat=float(location_coords["latitude"]),
                    long=float(location_coords["longitude"]),
                    location=validated_data["location"],
                    duration=duration,
                    duty_status=validated_data["duty_status"],
                    start_time=start_time,
                    end_time=end_time,
                    activity=validated_data["activity"],
                )

                # Update duty status hours
                total_time = duration

                # Update specific duty status hours based on activity type
                if validated_data["duty_status"] == "sleeper":
                    # Update berth time
                    logsheet.berth += total_time

                elif validated_data["duty_status"] == "driving":
                    # Validate and update driving time within HOS limits
                    if logsheet.on_duty_start_time is None:
                        logsheet.on_duty_start_time = start_time

                    if logsheet.on_duty + logsheet.driving + total_time > DAILY_ON_DUTY_LIMIT:
                        remaining = DAILY_ON_DUTY_LIMIT - (logsheet.on_duty + logsheet.driving)
                        raise ValidationError({
                            "error": "14-hr Window exceeded",
                            "success": False,
                            "msg": f"You have {remaining} hours left. Choose within that range." if remaining > 0 else "You cannot be on duty anymore."
                        })
                    if logsheet.driving + total_time > DAILY_DRIVING_LIMIT:
                        remaining = DAILY_DRIVING_LIMIT - logsheet.driving
                        raise ValidationError({
                            "error": "Driving limit exceeded",
                            "success": False,
                            "msg": f"You have {remaining} hours left. Choose within that range." if remaining > 0 else "You cannot be driving anymore."
                        })

                    logsheet.driving += total_time

                elif validated_data["duty_status"] == "on_duty":
                    if logsheet.on_duty + logsheet.driving + total_time > DAILY_ON_DUTY_LIMIT:
                        remaining = DAILY_ON_DUTY_LIMIT - (logsheet.on_duty + logsheet.driving)
                        raise ValidationError({
                            "error": "14-hr Window exceeded",
                            "success": False,
                            "msg": f"You have {remaining} hours left. Choose within that range." if remaining > 0 else " You cannot be on duty anymore."
                        })
                    # Update on-duty time
                    if logsheet.on_duty_start_time is None:
                        logsheet.on_duty_start_time = start_time
                    logsheet.on_duty += total_time
                else:
                    # Update off-duty time
                    logsheet.off_duty += total_time

                logsheet.save()
                total_elapsed = _time.perf_counter() - start_perf
                logger.info(
                    "Created LogEntry id=%s logsheet=%s duty_status=%s duration=%.2f total_time=%.4fs on_duty=%.2f driving=%.2f off_duty=%.2f berth=%.2f",
                    logentry.id,
                    logsheet.id,
                    validated_data.get('duty_status'),
                    float(duration),
                    total_elapsed,
                    float(logsheet.on_duty),
                    float(logsheet.driving),
                    float(logsheet.off_duty),
                    float(logsheet.berth),
                )
                return logentry
        except ValidationError as ve:
            logger.warning("ValidationError creating LogEntry: %s", ve)
            raise
        except Exception as e:
            logger.exception("Unexpected error creating LogEntry: %s", e)
            raise ValidationError({
                "error": "Error creating LogEntry",
                "success": False,
                "msg": str(e)
            })
    
    

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        logger.debug("LogEntry.validate called: log_id=%s span=%s startTime=%s duty_status=%s", attrs.get("log_id"), attrs.get("span"), attrs.get("startTime"), attrs.get("duty_status"))
        """Validate incoming log entry data before attempting DB writes.

        Performs format checks for span and startTime, ensures logsheet exists for today,
        verifies location geocoding, continuity with previous entry, 24-hour duration checks,
        and runs hos_checker early so we fail fast.
        """
        sheet_id = attrs.get("log_id")
        if not sheet_id:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "log_id is required.",
            })

        span = attrs.get("span", "")
        if not re.match(r"^\d{1,2}:\d{2}$", span):
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "span must be in format H:M or HH:MM (e.g. '1:30' or '12:05').",
            })
        hours, minutes = map(int, span.split(":"))
        if minutes >= 60:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "minutes must be less than 60.",
            })
        if hours < 0 or hours > 24 or (hours == 24 and minutes > 0):
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "hours must be between 0 and 24, and if 24, minutes must be 0.",
            })

        # startTime is provided as a write-only field (string HH:MM)
        start_time_str = attrs.get("startTime")
        if start_time_str is None:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "startTime is required.",
            })
        try:
            # Calculate start time

            start_time = datetime.strptime(start_time_str, "%H:%M").time()
        except Exception:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "startTime must be in HH:MM format.",
            })

        allowed_statuses = {"sleeper", "driving", "on_duty", "off_duty"}
        if attrs.get("duty_status") not in allowed_statuses:
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": f"duty_status must be one of {sorted(allowed_statuses)}.",
            })

        try:
            location_coords = geocode_address(attrs.get("location", ""), API_KEY1)
        except Exception as e:
            logger.debug("Location validation failed for %s: %s", attrs.get("location", ""), e)
            raise ValidationError({
                "error": "Location validation failed",
                "success": False,
                "msg": str(e),
            })
        attrs["_location_coords"] = location_coords

        todays_date = datetime.now().strftime("%Y-%m-%d")
        
        # Validate logsheet existence
        logsheet = LogSheet.objects.filter(id=sheet_id, date=todays_date).first()
        if not logsheet:
            logger.debug("LogSheet not found for id=%s date=%s", sheet_id, todays_date)
            raise ValidationError({
                "error": "LogSheet not found",
                "success": False,
                "msg": f"LogSheet with id {sheet_id} not found for today {todays_date}.",
            })
        attrs["_logsheet_obj"] = logsheet


        start_dt = datetime.combine(datetime.today(), start_time)
        end_dt = start_dt + timedelta(hours=hours, minutes=minutes)
        duration = float(hours) + (float(minutes) / 60)

        if start_dt > datetime.now():
            raise ValidationError({
                "error": "Invalid activity time",
                "success": False,
                "msg": "You cannot enter activities you have not done.",
            })

        # Validate previous log entry continuity
        prev = LogEntry.objects.filter(logsheet=logsheet).order_by("-start_time").first()
        if prev and prev.end_time != start_time:
            raise ValidationError({
                "error": "Start time mismatch",
                "success": False,
                "msg": f"Start time must equal previous entry end time {prev.end_time}.",
            })
        
        # Validate 24-hour window
        end_time = end_dt.time()
        if start_time > end_time and not (end_time.hour == 0 and end_time.minute == 0 and end_time.second == 0):
            raise ValidationError({
                "error": "Duration exceeds 24 hours",
                "success": False,
                "msg": "Duration must be within 24 hours.",
            })

        try:
            logger.debug("Running hos_checker for logsheet=%s duty=%s duration=%.2f end_time=%s", logsheet.id, attrs["duty_status"], duration, end_time)
            hos_checker(logsheet, attrs["duty_status"], duration, end_time)
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError({
                "error": "HOS validation failed",
                "success": False,
                "msg": str(e),
            })

        attrs["_computed"] = {"start_time": start_time, "end_time": end_time, "duration": duration}
        logger.debug("LogEntry.validate successful for log_id=%s computed=%s", sheet_id, attrs["_computed"])
        return attrs