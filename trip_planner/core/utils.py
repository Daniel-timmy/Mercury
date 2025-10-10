from typing import Dict, Tuple, Any
import requests
from dotenv import load_dotenv
import os
from rest_framework.serializers import ValidationError  # type: ignore

from datetime import datetime, timedelta, time
from .models import LogSheet
from .constants import CYCLE_LIMIT, DAILY_DRIVING_LIMIT, DAILY_ON_DUTY_LIMIT

load_dotenv()

API_KEY: str | None = os.environ.get('API_KEY')

def geocode_address(address: str) -> Dict[str, float]:
    """
    Geocode an address to retrieve its longitude and latitude.

    Args:
        address (str): The address to geocode.

    Returns:
        Dict[str, str]: A dictionary containing longitude and latitude.

    Raises:
        ValidationError: If no coordinates are found for the address.
    """
    url: str = f"https://us1.locationiq.com/v1/search?key={API_KEY}&q={address}&format=json&"
    headers: Dict[str, str] = {"accept": "application/json"}

    response = requests.get(url, headers=headers)
    data: Dict[int, Any] = response.json()

    if not data:
        raise ValidationError({
            "error": "Geocoding failed",
            "success": False,
            "msg": f"No coordinates found for address: {address}"
        })

    result: Dict[str, float] = {'longitude': data[0]['lon'], "latitude": data[0]['lat']}
    return result

def get_route(start_coords: Tuple[float, float], end_coords: Tuple[float, float]) -> Dict[str, float]:
    """
    Get route data from OSRM (distance in miles, time in hours).

    Args:
        start_coords (Tuple[float, float]): Starting coordinates (latitude, longitude).
        end_coords (Tuple[float, float]): Ending coordinates (latitude, longitude).

    Returns:
        Dict[str, float]: A dictionary containing distance in miles and duration in hours.
    """
    url: str = f"http://router.project-osrm.org/route/v1/driving/{start_coords[1]},{start_coords[0]};{end_coords[1]},{end_coords[0]}"
    params: Dict[str, str] = {"overview": "full", "geometries": "polyline"}

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data: Any = response.json()["routes"][0]
        distance_miles: float = data["distance"] / 1609.34  # Convert meters to miles
        duration_hours: float = data["duration"] / 3600  # Convert seconds to hours
        return {"distance": distance_miles, "duration": duration_hours}
    except requests.RequestException as e:
        print(f"Request error: {str(e)}")
        raise ValidationError({
            "error": "Route request error",
            "success": False,
            "msg": f"Request error: {str(e)}"
        })
    except (KeyError, IndexError) as e:
        raise ValidationError({
            "error": "Routing error",
            "success": False,
            "msg": f"Routing error: {str(e)}"
        })

def cycle_time_checker(current_cycle_hours: float) -> None:
    """
    Check if the current cycle hours exceed the cycle limit.

    Args:
        current_cycle_hours (float): The current cycle hours.

    Raises:
        ValidationError: If the cycle limit is exceeded.
    """
    if current_cycle_hours >= CYCLE_LIMIT:
        raise ValidationError({
            'error': 'Cycle limit reached',
            'success': False,
            'msg': f'You have reached your {CYCLE_LIMIT}-hour cycle limit. Please take the required rest before continuing your trip.'
        })

def hos_checker(
    logsheet: LogSheet, 
    duty_status: str, 
    duration: float, 
    end_time: time
) -> None:
    """
    Check Hours of Service (HOS) compliance.

    Args:
        logsheet (Any): The logsheet object containing driving and on-duty hours.
        duty_status (str): The current duty status ('driving', 'on_duty', etc.).
        duration (float): The duration of the activity in hours.
        start_time (datetime): The start time of the activity.
        end_time (datetime): The end time of the activity.

    Raises:
        ValidationError: If any HOS rule is violated.
    """
    proposed_driving: float = logsheet.driving
    proposed_on_duty: float = logsheet.on_duty
    proposed_total_on_duty_day: float = logsheet.driving + logsheet.on_duty

    if duty_status == 'driving':
        proposed_driving += duration
        proposed_total_on_duty_day += duration
    elif duty_status == 'on_duty':
        proposed_on_duty += duration
        proposed_total_on_duty_day += duration

    # Check daily driving limit
    if proposed_driving > DAILY_DRIVING_LIMIT:
        raise ValidationError({
            'error': 'Daily driving limit exceeded',
            'success': False,
            'msg': f"Exceeds daily driving limit of {DAILY_DRIVING_LIMIT} hours." 
                   f"You have {DAILY_DRIVING_LIMIT - logsheet.driving} hours left. Choose within that range"
        })

    # Check daily on-duty limit (14-hour window for driving)
    if logsheet.on_duty_start_time:
        activity_end_datetime: datetime = datetime.combine(datetime.today(), end_time)
        todays_start_datetime: datetime = datetime.combine(datetime.today(), logsheet.on_duty_start_time)
        on_duty_duration: timedelta = activity_end_datetime - todays_start_datetime

        if on_duty_duration > timedelta(hours=DAILY_ON_DUTY_LIMIT) and (duty_status == 'driving' or duty_status == 'on_duty') :
            raise ValidationError({
                'error': 'On-duty window exceeded',
                'success': False,
                'msg': f"Duration exceeds 14-hour on-duty window for {duty_status} activity(s). "
                       f"You have {DAILY_ON_DUTY_LIMIT - (logsheet.on_duty + logsheet.driving)} hours left. Choose within that range."
            })

    # Check weekly 70-hour limit (using current_cycle_hours + day's on-duty total)
    proposed_cycle_total: float = logsheet.current_cycle_hours + proposed_total_on_duty_day
    if proposed_cycle_total > CYCLE_LIMIT:
        raise ValidationError({
            'error': 'Cycle limit exceeded',
            'success': False,
            'msg': f'Exceeds 70-hour cycle limit. Proposed total: {proposed_cycle_total}.'
        })