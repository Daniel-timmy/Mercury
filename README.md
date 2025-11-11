
# Mercury

Mercury is a full-stack logistics application for planning drivers' trips, tracking Hours of Service (HOS), and visualizing routes and activities. It combines a Django REST API backend with a modern React (Vite) frontend, supporting real-time data, geocoding, and compliance validation.

---

## Table of Contents

- Project Overview
- Architecture
- Features
- Data Models
- API Endpoints
- Project Structure
- Setup & Development
  - Backend (Django)
  - Frontend (Vite + React)
- Environment Variables
- Tests & Linting
- Debugging & Troubleshooting
- Development Guidelines
- Deployment
- Future Enhancements
- License

---

## Project Overview

Spotter enables fleet managers and drivers to:
- Plan and manage trips, vehicles, and shipments
- Track daily logsheets and log entries for HOS compliance
- Visualize routes, stops, and driver positions on interactive maps
- Integrate geocoding and routing via LocationIQ and OSRM (backend) and ArcGIS (frontend)
- Enforce regulatory limits for driving and on-duty hours

---

## Architecture

**Backend: Django REST Framework**
- Apps: `core`, `fleet`, `user`
- Models: `Trip`, `LogSheet`, `LogEntry`, `DriverPosition`
- Serializers: Handle creation, validation, geocoding, route planning, and HOS checks
- Views: Role-based access, CRUD for all models, filtering, and ordering
- Channels: Real-time driver position updates via Redis

**Frontend: React + Vite**
- Entry: `frontend/src/main.jsx`
- Components: Logsheet management, modals, map visualization, side panel navigation
- Hooks: Data fetching, caching, API integration
- Theming: HeroUI, Tailwind CSS, dark mode
- Mapping: ArcGIS SDK, D3.js for data visualization

---

## Features

- **Trip & LogSheet Management:** Create, view, and manage trips and daily logsheets
- **Log Entry Tracking:** Record driver activities, locations, and status changes
- **Route Planning:** Automated route calculation and fueling stop generation
- **HOS Compliance:** Enforce daily/weekly driving and on-duty limits
- **Interactive Mapping:** Visualize routes, stops, and driver positions
- **Real-time Data:** Live updates for driver positions and logsheet changes
- **Responsive UI:** Desktop and mobile support, dark theme, toast notifications

---

## Data Models

### Trip
- `id`, `manager`, `driver`, `start_location`, `pickup_location`, `dropoff_location`
- `start_coords`, `pickup_coords`, `end_coords`, `stops` (JSON)
- `total_mileage`, `start_date`, `duration_days`, `status`, `shipper`, `commodity`
- `created_at`, `updated_at`

### LogSheet
- `id`, `trip`, `driver`, `vehicle_no`, `trailer_no`, `total_mileage`
- `date`, `created_at`, `updated_at`, `on_duty_start_time`
- HOS: `off_duty`, `on_duty`, `berth`, `driving`, `current_cycle_hours`
- Location: `start_location`, `start_coords`
- `remarks`

### LogEntry
- `id`, `logsheet`, `lat`, `long`, `location`
- `start_time`, `end_time`, `duration`, `date`
- `duty_status` (choices: off_duty, sleeper, driving, on_duty)
- `activity`, `created_at`, `updated_at`

### DriverPosition
- `id`, `driver`, `position_coords` (JSON), `timestamp`, `created_at`

### Fleet
- `id`, `name`, `manager`, `created_at`, `updated_at`

### Vehicle
- `id`, `fleet`, `driver`, `license_plate`, `vehicle_type`, `capacity_kg`, `capacity_cubic_meters`, `fuel_type`, `ownership_status`, `current_mileage_km`, `last_maintenance_date`, `next_maintenance_due_date`, `is_active`, `created_at`, `updated_at`

### VehicleStatusLog
- `id`, `vehicle`, `driver`, `latitude`, `longitude`, `speed_kmh`, `status`, `recorded_at`

### FuelLog
- `id`, `vehicle`, `driver`, `liters`, `cost`, `odometer_reading_km`, `fuel_station_name`, `receipt_photo_url`, `logged_at`

### MaintenanceAlert
- `id`, `vehicle`, `alert_type`, `is_resolved`, `resolved_at`, `notes`, `created_at`

### User
- `id`, `email`, `name`, `role` (choices: admin, manager, driver), `date_joined`, `is_active`, `is_staff`, `is_superuser`, `created_at`, `updated_at`, `manager` (for drivers)

---

## API Endpoints


All endpoints require authentication (JWT by default). Role-based access is enforced for all resources.

### Core
- `/trips/` — CRUD for trips (admin, manager, driver)
- `/logsheets/` — CRUD for log sheets (drivers only)
   - Query: `date` to filter by day
- `/logentries/` — CRUD for log entries (drivers only)
   - Query: `log_id` to fetch entries for a logsheet
- `/driverpositions/` — CRUD for driver positions (real-time updates)

### Fleet
- `/fleets/` — CRUD for fleets (admin only; managers can view their own)
- `/vehicles/` — CRUD for vehicles (admin, manager; drivers can view their assigned vehicle)
- `/vehicle-status-logs/` — Create and view vehicle status logs (drivers, managers, admin)
- `/fuel-logs/` — Create and view fuel logs (drivers only; managers/admin can view all)
- `/maintenance-alerts/` — Create and view maintenance alerts (drivers only; managers/admin can view all)

### User
- `/drivers/` — CRUD for driver users (admin, manager)
- `/managers/` — CRUD for manager users (admin only)
- `/admins/` — CRUD for admin users (admin only)

#### Permissions & Access
- **Admin:** Full access to all endpoints and resources
- **Manager:** Can manage fleets, vehicles, and their own drivers
- **Driver:** Can manage their own logs, positions, fuel logs, and view assigned vehicle

Serializers handle:
- Geocoding addresses (LocationIQ)
- Route calculation (OSRM)
- Fueling stop generation
- HOS rule enforcement

---

## Project Structure

```
Spotter/
├── trip_planner/         # Django backend
│   ├── core/             # Main app: models, views, serializers, utils
│   ├── fleet/            # Fleet management
│   ├── user/             # User management
│   ├── db.sqlite3        # Default database
│   ├── manage.py         # Django CLI
│   └── ...               # Settings, migrations, etc.
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── theme/        # Theme config
│   │   └── ...           # Entry, styles
│   ├── public/           # Static assets
│   ├── package.json      # Dependencies
│   ├── vite.config.js    # Vite config
│   └── README.md         # Frontend docs
├── README.md             # Main project documentation
└── vercel.json           # Deployment config
```

---

## Setup & Development

### Backend (Django)

1. **Create and activate a virtual environment:**
   ```powershell
   python -m venv .venv; .\.venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   # Or, if missing:
   pip install django djangorestframework python-dotenv requests channels redis django-filter
   ```

3. **Configure environment variables:**
   Create a `.env` file in `trip_planner/`:
   ```
   API_KEY=your_locationiq_api_key
   DJANGO_SECRET_KEY=your_secret
   DEBUG=True
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host
   DB_PORT=5432
   SECRET=your-django-secret-key
   HOST=allowed_host
   FRONTEND_URL=http://localhost:5173
   ```

4. **Apply migrations and run the server:**
   ```linux(terminal 1)
   cd trip_planner
   python manage.py migrate
   daphne -p 8000 trip_planner.asgi:application
   ```
   ```linux(terminal 2)
   cd trip_planner
   celery -A trip_planner worker --loglevel=info
   ```

### Frontend (Vite + React)

1. **Install dependencies:**
   ```linux
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in `frontend/`:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_ARCGIS_API_KEY=your-arcgis-api-key
   ```

3. **Run the development server:**
   ```linux
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

- **Backend:**
  - `API_KEY` — LocationIQ API key
  - `DJANGO_SECRET_KEY`, `DEBUG`, `DB_*`, `SECRET`, `HOST`, `FRONTEND_URL`
- **Frontend:**
  - `VITE_API_URL` — Backend API endpoint
  - `VITE_ARCGIS_API_KEY` — ArcGIS API key

---

## Tests & Linting

- **Backend:** Run tests with
  ```powershell
  cd trip_planner
  python manage.py test
  ```
- **Frontend:** Lint and test using scripts in `frontend/package.json` (ESLint configured).

---

## Debugging & Troubleshooting

- **Geocoding/Mapping:** Ensure API keys are valid and network access is available.
- **API Requests:** Confirm environment variables and backend server status.
- **Frontend Issues:** Check browser console and network tab for errors.
- **Backend Issues:** Review logs and DRF error responses.

---

## Development Guidelines

- Use functional React components and hooks
- Follow best practices for state management and performance
- Keep components small and focused
- Use meaningful variable names and JSDoc comments
- Memoize and lazy-load where appropriate

---

## Deployment

1. **Set production environment variables**
2. **Build frontend:**
   ```powershell
   npm run build
   ```
3. **Deploy the `dist` folder and backend to your hosting service**

---

## Future Enhancements

- Real-time tracking updates
- Multi-driver support
- Advanced analytics dashboard
- Export (PDF, Excel)
- Mobile app version
- Offline mode
- Route optimization
- Weather integration
- Fuel cost calculations

---

## License

[MIT License](LICENSE)


