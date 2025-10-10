# Spotter — Trip Planner

Spotter is a Django + React (Vite) application for planning drivers' trips and tracking Hours of Service (HOS). It provides LogSheet and LogEntry models and REST APIs to create, update and query driver logs, route calculations, and HOS compliance checks.

## Table of contents

- Project overview
- Architecture
- Features
- Data models
- API endpoints
- Setup & development
  - Backend (Django)
  - Frontend (Vite + React)
- Environment variables
- Tests & linting
- Notes & troubleshooting
- License

## Project overview

This repository contains a backend Django project (`trip_planner`) that exposes a REST API for managing driver log sheets and log entries, and a frontend React application (inside `frontend/`) built with Vite for interacting with the API.

Key backend responsibilities:
- Create and manage `LogSheet` objects representing a driver’s day, vehicle, route, and HOS totals.
- Create and manage `LogEntry` objects representing status changes (driving, off duty, sleeper, on duty) with timestamps and locations.
- Geocoding addresses and requesting routes via external services (LocationIQ and OSRM) in `core/utils.py`.
- HOS validation to ensure drivers remain within daily/weekly limits.

Frontend (in `frontend/`) provides components for viewing and editing logs, a side panel UI, line graphs, and modals for adding log entries.

## Architecture

- Backend: Django REST Framework
  - App: `core`
    - Models: `LogSheet`, `LogEntry` (`core/models.py`)
    - Serializers: `core/serializers.py` (handles creation logic, validation, route planning)
    - Views: `core/views.py` (ViewSets for LogSheet and LogEntry)
    - Utils: `core/utils.py` (geocoding, routing, HOS checks)
    - URLs: `core/urls.py`
- Frontend: React + Vite (`frontend/`)
  - Entry: `frontend/src/main.jsx`
  - Components under `frontend/src/components/`
  - Hooks under `frontend/src/hooks/`

## Features

- LogSheet creation with automated route planning and fueling stop calculation
- LogEntry creation with HOS compliance checks (daily driving, 14-hour window, 70-hour weekly cycle)
- Geocoding and routing integrations
- REST API with paginated/filtered endpoints

## Data models (summary)

- LogSheet
  - Fields: id (UUID), driver, shipper, commodity, vehicle_no, trailer_no, total_mileage, date, created_at, updated_at
  - HOS totals: off_duty, on_duty, berth, driving, current_cycle_hours
  - Locations: current_location, pickup_location, dropoff_location, current_coords (JSON), pickup_coords, end_coords
  - Stops: JSON list describing pickup/fueling/dropoff stops

- LogEntry
  - Fields: id (UUID), logsheet (FK), lat, long, location, start_time, end_time, duration, date, duty_status, activity

Refer to `core/models.py` for full field definitions and validators.

## API endpoints

Routes are registered in `core/urls.py` using DRF's DefaultRouter:

- /logsheets/ — CRUD for `LogSheet` (ViewSet: `LogSheetViewSet`)
  - Query parameter: `date` to filter logs by date
- /logentries/ — CRUD for `LogEntry` (ViewSet: `LogEntryViewSet`)
  - Query parameter: `log_id` to fetch entries for a specific LogSheet

Serializers include creation logic that:
- Geocodes addresses (LocationIQ) and calculates routes (OSRM)
- Computes fueling stops based on `FUELING_INTERVAL_MILES`
- Enforces HOS rules via `core/utils.hos_checker`

Authentication: `LogSheetViewSet` requires `IsAuthenticated` by default in the codebase; confirm project settings for authentication behavior.

## Setup & development

Prerequisites:
- Python 3.11+ (project shows Python 3.12 pyc files — use Python 3.11+ or 3.12 if available)
- Node.js 16+ (for frontend / Vite)
- pip or poetry for Python dependencies
- (Optional) SQLite is included at `trip_planner/db.sqlite3` for quick local testing

Backend (Django)

1. Create and activate a virtual environment:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install dependencies. If a `requirements.txt` is not present, install the typical packages used:

```powershell
pip install django djangorestframework python-dotenv requests
```

3. Set environment variables. Create a `.env` file in `trip_planner/` with:

```env
API_KEY=your_locationiq_api_key
DJANGO_SECRET_KEY=your_secret
DEBUG=True for development
DB_NAME = 'database name'
DB_USER = 'db username'
DB_PASSWORD = '3JgYTnRzrlwPOAdTF2ppXc7k2tZdBdWW'
DB_HOST = 'database host if your are using external db services'
DB_PORT = '5432'
SECRET = "your-django-secret-key"
HOST = "allowed host"
FRONTEND_URL = "http://localhost:5173"
```

4. Apply migrations and run the development server:

```powershell
cd trip_planner; python manage.py migrate; python manage.py runserver
```

5. The admin and API browsable endpoints will be available at http://127.0.0.1:8000/ (adjust host/port as needed)

Frontend (Vite + React)

1. Install dependencies and run dev server:

```powershell
cd frontend
npm install
npm run dev
```

2. The Vite dev server typically runs at http://localhost:5173 — open the app in your browser and configure the frontend to point to the backend API base URL.

## Environment variables

- API_KEY — LocationIQ API key used by `core/utils.geocode_address`
- (Optional) Other Django environment variables such as `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DEBUG`.

## Tests & linting

- The backend includes `core/tests.py` — run tests with:

```powershell
cd trip_planner
python manage.py test
```

- Frontend linting and testing follow the `frontend/package.json` scripts (ESLint is present).

## Notes & troubleshooting

- geocoding/routing requires network access and valid API keys. If geocoding fails, `core/utils` raises a `ValidationError` returned by DRF responses.
- OSRM routing uses the public router at `router.project-osrm.org`. For high reliability or privacy, consider running a self-hosted OSRM instance.
- `LogEntrySerializer` and `LogSheetSerializer` include complex create/validate logic. If you extend them, add tests to cover HOS edge cases and route failures.


---


