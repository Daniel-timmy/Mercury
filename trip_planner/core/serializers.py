from typing import Any, Dict, List
from datetime import datetime, timedelta, time
import re
import logging
import time as _time
import os

from django.db import transaction
from rest_framework import serializers  # type: ignore
from rest_framework.serializers import ValidationError  # type: ignore
from dotenv import load_dotenv

from .models import LogEntry, LogSheet
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

class LogSheetSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and managing driver log sheets.
    Handles route planning, fueling stops, and basic log sheet operations.
    """

    class Meta:
        model = LogSheet
        fields = [
            "id",
            "shipper",
            "commodity",
            "total_mileage",
            "date",
            "berth",
            "on_duty",
            "off_duty",
            "driving",
            "on_duty_start_time",
            "driver",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "vehicle_no",
            "total_mileage",
            "trailer_no",
            "shipper",
            "commodity",
            "current_cycle_hours",
            "stops",
            "start_coords",
            "end_coords",
            "pickup_coords",
            "created_at",

             ]
        read_only_fields = [
            "id",
            "date",
            "berth",
            "on_duty",
            "off_duty",
            "driving",
            "on_duty_start_time",
            "stops",
            "start_coords",
            "end_coords",
            "pickup_coords",
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
        todays_date = datetime.now().strftime("%Y-%m-%d")
        logger.debug(
            "LogSheet.create called: driver=%s vehicle_no=%s pickup=%s dropoff=%s",
            validated_data.get("driver"),
            validated_data.get("vehicle_no"),
            validated_data.get("pickup_location"),
            validated_data.get("dropoff_location"),
        )

        # Extract and validate location data
        current_address: str = validated_data["current_location"]
        dropoff_address: str = validated_data["dropoff_location"]
        pickup_location: str = validated_data["pickup_location"]

        # Convert addresses to coordinates for route planning
        current_coords = geocode_address(current_address, API_KEY1)
        logger.debug("Geocode current_location=%s -> %s", current_address, current_coords)
        end_coords = geocode_address(dropoff_address, API_KEY2)
        logger.debug("Geocode dropoff_location=%s -> %s", dropoff_address, end_coords)
        pickup_coords = geocode_address(pickup_location, API_KEY1)
        logger.debug("Geocode pickup_location=%s -> %s", pickup_location, pickup_coords)

        # Calculate multi-leg route distances
        leg1 = (
            get_route((current_coords['latitude'], current_coords['longitude']),
                        (pickup_coords['latitude'], pickup_coords['longitude']))
            if current_address != pickup_location
            else {"distance": 0, "duration": 0}
        )
        logger.debug("Route leg1 result: %s", leg1)
        leg2 = get_route((pickup_coords['latitude'], pickup_coords['longitude']),
                          (end_coords['latitude'], end_coords['longitude']))
        logger.debug("Route leg2 result: %s", leg2)
        total_distance = leg1["distance"] + leg2["distance"]
        logger.info("Total route distance computed: %.2f (leg1=%.2f, leg2=%.2f)", float(total_distance), float(leg1["distance"]), float(leg2["distance"]))

        # Calculate fueling stops based on total distance
        fueling_stops: List[Dict[str, Any]] = []
        if total_distance > FUELING_INTERVAL_MILES:
            num_fueling_stops = int(total_distance // FUELING_INTERVAL_MILES)
            logger.debug("Total distance %.2f > fueling interval %s -> num_fueling_stops=%d", float(total_distance), FUELING_INTERVAL_MILES, num_fueling_stops)
            for i in range(num_fueling_stops):
                stop_location = pickup_location if i == 0 else dropoff_address
                fueling_stops.append({
                    "type": "fueling",
                    "location": stop_location,
                    "distance": (i + 1) * FUELING_INTERVAL_MILES
                })

        logger.debug("Stops assembled: pickup + %d fueling + dropoff", len(fueling_stops))
        # Combine all stops including pickup, fueling, and dropoff
        stops: List[Any] = [
            {"type": "pickup", "location": pickup_location, "duration_hours": PICKUP_DROPOFF_HOURS},
            *fueling_stops,
            {"type": "dropoff", "location": dropoff_address, "duration_hours": PICKUP_DROPOFF_HOURS},
        ]

        try:
            tx_start = _time.perf_counter()
            with transaction.atomic():
                # Create logsheet with all route and stop information
                logsheet = LogSheet.objects.create(
                   driver=validated_data.get("driver", "Driver"),
                   current_location=current_address,
                   pickup_location=pickup_location,
                   dropoff_location=dropoff_address,
                   vehicle_no=validated_data["vehicle_no"],
                   start_coords=current_coords,
                   end_coords=end_coords,
                   trailer_no=validated_data.get("trailer_no", ""),
                   pickup_coords=pickup_coords,
                   total_mileage=total_distance,
                   shipper=validated_data["shipper"],
                   commodity=validated_data["commodity"],
                   current_cycle_hours=validated_data["current_cycle_hours"],
                   stops=stops,
                )
                logsheet.save()
                tx_elapsed = _time.perf_counter() - tx_start
                total_elapsed = _time.perf_counter() - start_perf
                logger.info(
                    "Created LogSheet id=%s driver=%s total_mileage=%.2f tx_time=%.4fs total_time=%.4fs",
                    logsheet.id,
                    logsheet.driver,
                    float(total_distance),
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

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        logger.debug("LogSheet.validate called with keys=%s", list(attrs.keys()))
        """Validate basic logsheet fields before creation.

        Checks presence of address fields, ensures pickup != dropoff,
        requires vehicle_no, and verifies addresses can be geocoded.
        """
        required_addresses = ("current_location", "pickup_location", "dropoff_location")
        for f in required_addresses:
            if not attrs.get(f) or not isinstance(attrs.get(f), str):
                raise ValidationError({
                    "error": "Validation error",
                    "success": False,
                    "msg": f"{f} is required and must be a string.",
                })

        if attrs["pickup_location"].strip() == attrs["dropoff_location"].strip():
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "Pickup and dropoff locations must be different.",
            })

        if not attrs.get("vehicle_no"):
            raise ValidationError({
                "error": "Validation error",
                "success": False,
                "msg": "vehicle_no is required.",
            })

        # # verify addresses can be geocoded
        # try:
        #     # improve by using another validation method that doesn't return coords
        #     _ = geocode_address(attrs["current_location"])
        #     _ = geocode_address(attrs["pickup_location"])
        #     _ = geocode_address(attrs["dropoff_location"])
        # except Exception as e:
        #     raise ValidationError({
        #         "error": "Address validation failed",
        #         "success": False,
        #         "msg": str(e),
        #     })

        return attrs


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
         # Extract and validate time-related data
        sheet_id = validated_data.pop("log_id", None)
        startTime = validated_data.pop("startTime", None)
        todays_date = datetime.now().strftime("%Y-%m-%d")

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
            location_coords = geocode_address(attrs.get("location", ""))
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