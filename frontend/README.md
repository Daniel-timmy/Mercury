# Spotter - Logistics Tracking Application

A modern web application for tracking and managing trucking logsheets with real-time route visualization and comprehensive log entry management.

## 🚀 Features

### Core Functionality
- **Logsheet Management**: Create, view, and manage daily logsheets for drivers
- **Interactive Route Mapping**: Visualize routes with ArcGIS integration showing:
  - Start, pickup, and dropoff locations
  - Log entry waypoints along the route
  - Automatic interval stops every 1000 miles for refueling/rest
  - Interactive popups with location details
- **Log Entry Tracking**: Record activities and locations throughout the journey
- **Real-time Data Synchronization**: Automatic refresh of logsheet data after updates
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### User Interface
- **Side Panel Navigation**: Browse logsheets grouped by date
- **Visual Feedback**: Selected logsheet highlighted with blue background
- **Loading States**: Spinner indicators during data operations
- **Toast Notifications**: Success and error messages for user actions
- **Dark Theme**: Modern dark-gray map visualization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **ArcGIS API Key** (for map functionality)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://your-backend-api-url
   VITE_ARCGIS_API_KEY=your-arcgis-api-key
   ```

   - `VITE_API_URL`: Your backend API endpoint
   - `VITE_ARCGIS_API_KEY`: Get your free API key from [ArcGIS Developers](https://developers.arcgis.com/)

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

The optimized production build will be created in the `dist` directory.

To preview the production build:
```bash
npm run preview
```

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
│   └── vite.svg
├── src/
│   ├── assets/            # Images and static resources
│   │   └── react.svg
│   ├── components/        # React components
│   │   ├── LineGraph.jsx      # Data visualization component
│   │   ├── LogEntryModal.jsx  # Modal for creating log entries
│   │   ├── LogsheetCard.jsx   # Display logsheet details
│   │   ├── LogsheetModal.jsx  # Modal for creating logsheets
│   │   ├── Map.jsx            # Interactive map component
│   │   ├── PanelItem.jsx      # Individual logsheet list item
│   │   └── SidePanel.jsx      # Navigation sidebar
│   ├── hooks/             # Custom React hooks
│   │   ├── api.js             # Axios API client
│   │   └── usePanelData.js    # Data fetching hook with caching
│   ├── theme/             # UI theme configuration
│   │   └── hero.js            # HeroUI theme customization
│   ├── App.css            # Application styles
│   ├── App.jsx            # Main application component
│   ├── index.css          # Global styles
│   └── main.jsx           # Application entry point
├── .env                   # Environment variables (create this)
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML template
├── package.json           # Project dependencies
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🎨 Technology Stack

### Frontend Framework
- **React 19** - UI library 
- **Vite** - Fast build tool and development server

### UI Components & Styling
- **HeroUI** -  React component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **FontAwesome** - Icon library

### Mapping & Visualization
- **ArcGIS Maps SDK** - Professional mapping and routing
- **D3.js** - Data visualization

### Data Management
- **Axios** - HTTP client for API requests
- **Custom Hooks** - Data fetching with built-in caching

## 🔧 Configuration Files

### Vite Configuration (`vite.config.js`)
This template provides a minimal setup to get React working in Vite with HMR and ESLint rules.

Currently using:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) - Uses Babel for Fast Refresh

### ESLint Configuration (`eslint.config.js`)
Configured for React 19 with recommended rules and hooks validation.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 📱 Key Components

### App.jsx
Main application component that manages:
- Logsheet and log entry state
- Modal visibility
- API interactions
- Component orchestration

### Map.jsx
Interactive mapping component featuring:
- Route calculation and visualization
- Multiple marker types (start, pickup, dropoff, entries)
- Automatic interval stop generation
- Interactive popups with location information
- Geodetic distance calculations

### SidePanel.jsx
Navigation sidebar with:
- Logsheet list grouped by date
- Selected item highlighting
- Delete functionality
- Responsive drawer for mobile
- Manual refresh capability

### LogsheetModal.jsx
Form for creating new logsheets with:
- Driver information
- Location details (current, pickup, dropoff)
- Vehicle information
- Shipment details
- Hours tracking
- Form validation
- Loading states

### LogEntryModal.jsx
Form for adding log entries with:
- Location and activity tracking
- Coordinate input
- Timestamp recording

## 🔄 Data Flow

1. **Initialization**: App loads and fetches logsheets via `usePanelData` hook
2. **Display**: SidePanel shows logsheets grouped by date
3. **Selection**: User clicks a logsheet, triggering:
   - Main sheet update
   - Log entries fetch
   - Map route calculation and rendering
4. **Creation**: User creates new logsheet/entry:
   - Modal form submission
   - API request
   - Success/error toast notification
   - Automatic data refresh
   - UI update

## 🎯 API Integration

The application expects the following API endpoints:

### Logsheets
- `GET /logsheets/` - Fetch all logsheets
- `POST /logsheets/` - Create new logsheet
- `DELETE /logsheets/:id/` - Delete logsheet

### Log Entries
- `GET /logentries/?log_id=:id` - Fetch entries for a logsheet
- `POST /logentries/` - Create new log entry

### Expected Data Structures

**Logsheet Object:**
```javascript
{
  id: number,
  driver: string,
  current_location: string,
  pickup_location: string,
  dropoff_location: string,
  vehicle_no: string,
  trailer_no: string,
  shipper: string,
  commodity: string,
  current_cycle_hours: number,
  start_coords: { latitude: number, longitude: number },
  pickup_coords: { latitude: number, longitude: number },
  end_coords: { latitude: number, longitude: number },
  created_at: string (ISO date)
}
```

**Log Entry Object:**
```javascript
{
  id: number,
  log_id: number,
  location: string,
  activity: string,
  lat: number,
  long: number,
  timestamp: string (ISO date)
}
```

## 🎨 Theming

The application uses HeroUI with custom theme configuration in `src/theme/hero.js`. The theme includes:
- Custom color schemes
- Typography settings
- Component variants
- Dark mode support

## 🐛 Debugging

### Common Issues

1. **Map not loading**
   - Verify `VITE_ARCGIS_API_KEY` is set correctly
   - Check browser console for API errors
   - Ensure coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

2. **API requests failing**
   - Verify `VITE_API_URL` is set correctly
   - Check network tab in browser dev tools
   - Ensure backend is running and accessible

3. **Spinner not showing**
   - Check that loading state is properly managed
   - Verify async operations are awaited correctly

## 📝 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React 19 best practices
- Use TypeScript-style JSDoc comments
- Keep components small and focused
- Use meaningful variable names

### State Management
- Local state for UI concerns
- API calls through custom hooks
- Caching for performance optimization

### Performance
- Memoization where appropriate
- Lazy loading for heavy components
- Efficient re-render prevention
- Optimized map rendering

## 🚀 Deployment

### Environment Setup
1. Set production environment variables
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting service



## 🔮 Future Enhancements

- [ ] Real-time tracking updates
- [ ] Multi-driver support
- [ ] Advanced analytics dashboard
- [ ] Export functionality (PDF, Excel)
- [ ] Mobile app version
- [ ] Offline mode support
- [ ] Route optimization suggestions
- [ ] Weather integration
- [ ] Fuel cost calculations

---
