import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import RouteLayer from "@arcgis/core/layers/RouteLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import esriConfig from "@arcgis/core/config";
import { useRef, useEffect, useState, useCallback } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Stop from "@arcgis/core/rest/support/Stop";
import Collection from "@arcgis/core/core/Collection";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import { usePositionContext } from "../hooks/usePosition";
import Polyline from "@arcgis/core/geometry/Polyline"; // Line geometry for routes
import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator.js"; // Calculates geodetic distances
import * as geodeticDensifyOperator from "@arcgis/core/geometry/operators/geodeticDensifyOperator.js"; // Adds points along a line
import { view } from "framer-motion/client";

// ArcGIS API key from environment variables
const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY;

// Helper function to create multiple marker graphics
function createMarkerGraphics(markerList) {
  return markerList.map(
    ({ geometry, color, name, description }) =>
      new Graphic({
        geometry,
        symbol: {
          type: "simple-marker",
          color,
          size: "12px",
        },
        attributes: {
          Name: name,
          Description: description,
        },
        popupTemplate: new PopupTemplate({
          title: "{Name}",
          content: "{Description}",
        }),
      })
  );
}

// Helper function to create Point objects from coordinates
function createPoints(coordsList) {
  return coordsList.map(
    ({ longitude, latitude }) =>
      new Point({
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 },
      })
  );
}

// Helper function to create Stop objects from points and names
function createStops(points, names) {
  return points.map(
    (geometry, idx) =>
      new Stop({
        geometry,
        name: names[idx],
      })
  );
}

const formatETA = (minutes) => {
  if (!minutes) return "--";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * MapCard Component
 * Displays an interactive map with routing visualization for logsheet entries
 *
 * Features:
 * - Shows route from start location through pickup to dropoff
 * - Displays log entry points along the route
 * - Adds interval stops every 1000 miles for refueling/rest
 * - Interactive popups with location details
 *
 * @param {Object} logsheet - The main logsheet data containing route information
 * @param {Object} trip - The trip data associated with the logsheet
 * @param {Array} entries - Array of log entries with coordinates and activities
 */
const MapCard = ({ logsheet, trip, entries }) => {
  // State for managing route stops and graphics
  const [stops, setStops] = useState([]); // Collection of stop points for routing
  const [graphics, setGraphics] = useState([]); // Visual markers for log entries
  const [driverStop, setCurrentDriverStop] = useState(null);
  const [routeLayer, setRouteLayer] = useState(null);
  const [incompleteRouteLayer, setIncompleteRouteLayer] = useState(null);
  const [etaDistToEnd, setEtaDistToEnd] = useState({ distance: 0, eta: "--" });
  const [routeGraphic, setRouteGraphic] = useState(null);
  const [startStop, setStartStop] = useState(null);
  const [endStop, setEndStop] = useState(null);
  const [errorMsg, setErrorMsg] = useState(""); // New: error message state
  const [pickupStop, setPickupStop] = useState(null);
  const [toggle, setToggle] = useState(false);

  const driverLayer = useRef(new GraphicsLayer());

  const viewRef = useRef(null);
  const mapDiv = useRef(null); // Reference to the map container DOM element
  const { position } = usePositionContext();

  // === 1. Update driver position from position context

  useEffect(() => {
    if (position) {
      const point = new Point({
        longitude: position.longitude,
        latitude: position.latitude,
        spatialReference: { wkid: 4326 },
      });
      setCurrentDriverStop(
        new Stop({ geometry: point, name: trip.pickup_location })
      );
    }
  }, [position]);

  /**
   * Effect: Convert log entries to visual graphics and  Convert log entries to route stops
   * Runs whenever entries array changes
   * Creates Stop objects from entry coordinates for route calculation
   * Creates yellow markers with popup information for each entry
   */
  useEffect(() => {
    const points = entries.map((entry) => {
      // Create geographic point from entry coordinates
      // wkid: 4326 is the WGS84 coordinate system (standard lat/long)
      return new Point({
        x: entry.long, // Longitude
        y: entry.lat, // Latitude
        spatialReference: { wkid: 4326 },
      });
    });
    setStops(() => {
      // Map each log entry to a Stop object for routing
      const stops = entries.map((entry, idx) => {
        // Create a Stop object for route calculation
        return new Stop({
          geometry: points[idx],
          name: entry.location,
        });
      });
      return stops;
    });
    setGraphics(() => {
      // Map each log entry to a Graphic object for display
      const graphics = entries.map((entry, idx) => {
        // Create a visual marker graphic
        return new Graphic({
          geometry: points[idx],
          symbol: {
            type: "simple-marker",
            color: "yellow", // Yellow markers for log entries
            size: "12px",
          },
          attributes: {
            Location: entry.location,
            Activity: entry.activity,
          },
          // Popup template for displaying entry information
          popupTemplate: new PopupTemplate({
            title: "{Location}",
            content: "{Activity}",
          }),
        });
      });
      return graphics;
    });
  }, [entries]);

  const solveCompletedRoute = useCallback(async () => {
    if (!routeLayer || !driverStop || !viewRef.current) return;

    try {
      // Order: start -> log entries -> currentPosition
      const completedStopsCollection = new Collection();
      completedStopsCollection.addMany([startStop, ...stops, driverStop]);

      //TODO: handle toggle state and also the drawn line
      const incompleteStopsCollection = new Collection();
      if (toggle) {
        incompleteStopsCollection.addMany([driverStop, pickupStop, endStop]);
      } else {
        incompleteStopsCollection.addMany([driverStop, endStop]);
      }
      // Load the route layer and set stops

      routeLayer.removeAll();
      incompleteRouteLayer.removeAll();
      routeLayer.stops = completedStopsCollection;
      incompleteRouteLayer.stops = incompleteStopsCollection;

      // Configure route calculation parameters
      const routeParams = {
        stops: completedStopsCollection,
        returnDirections: false,
        returnRoutes: true,
        returnStops: true,
        findBestSequence: false,
      };

      const incompleteRouteParams = {
        stops: incompleteStopsCollection,
        returnDirections: true,
        returnRoutes: true,
        returnStops: true,
        findBestSequence: false,
      };

      // Calculate the route
      const routeResult = await routeLayer.solve(routeParams);
      const incompleteRouteResult = await incompleteRouteLayer.solve(
        incompleteRouteParams
      );

      let completeRouteGraphic;
      let incompleteRouteGraphic;
      // If route calculation was successful, display it
      if (routeResult?.routeInfo?.geometry) {
        const routeGeometry = routeResult.routeInfo.geometry;

        // Create a blue line graphic for the route
        completeRouteGraphic = new Graphic({
          geometry: routeGeometry,
          symbol: {
            type: "simple-line",
            color: "white", // Blue route line
            width: 2,
          },
        });
      }
      if (incompleteRouteResult?.routeInfo?.geometry) {
        const incompleteRouteGeometry =
          incompleteRouteResult.routeInfo.geometry;
        incompleteRouteGraphic = new Graphic({
          geometry: incompleteRouteGeometry,
          symbol: {
            type: "simple-line",
            color: "blue", // Blue route line
            width: 2,
            style: "dash",
          },
        });
      }
      const totalMinutes = incompleteRouteResult?.routeInfo?.totalDuration;
      const totalDistance = incompleteRouteResult?.routeInfo?.totalDistance;
      if (totalMinutes && totalDistance) {
        setEtaDistToEnd({
          distance: totalDistance / 1000,
          eta: formatETA(totalMinutes),
        });
      }
      viewRef.current.graphics.removeAll();
      viewRef.current.graphics.addMany([
        routeGraphic,
        incompleteRouteGraphic,
        completeRouteGraphic,
      ]); // Route lin
      viewRef.current.goTo(incompleteRouteResult.routeInfo.geometry);
      setErrorMsg(""); // Clear any previous error
    } catch (error) {
      console.error("Error solving completed route:", {
        name: error.name,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      setErrorMsg(
        "Failed to calculate route. Please try again or check your network/API key."
      );
    }
  }, [
    routeLayer,
    incompleteRouteLayer,
    driverStop,
    driverLayer,
    position,
    stops,
    startStop,
    endStop,
    routeGraphic,
  ]);

  /**
   * Effect: Initialize and render the map
   * Main effect that creates the map, calculates routes, and adds all graphics
   * Runs when logsheet, entries, or stops change
   */
  useEffect(() => {
    // Don't render if no trip is available
    if (!trip) return;

    // Configure ArcGIS with API key
    esriConfig.apiKey = API_KEY;
    // esriConfig.routing = {
    //   useTraffic: true,
    //   trafficStartTime: new Date(), // live traffic
    // };

    if (mapDiv.current) {
      // Create the base map with dark gray basemap
      const webmap = new Map({
        basemap: "dark-gray-vector",
      });

      // Create the map view (the interactive display)
      const view = new MapView({
        container: mapDiv.current, // DOM element to render in
        map: webmap,
        center: [-117.149, 32.7353], // Default center (San Diego area)
        scale: 10000000, // Initial zoom level
      });
      viewRef.current = view;

      // Configure popup behavior
      view.popup.enabled = true; // Enable popups
      view.popup.autoOpenEnabled = false; // Don't auto-open on click
      view.popup.dockEnabled = true; // Allow docking to side
      view.popup.alignment = "auto"; // Auto-position popup
      view.popup.collapseEnabled = false; // Don't allow collapsing
      view.popup.actions = []; // No action buttons

      // Create layers for routing and interval stops
      const rl = new RouteLayer(); // Handles route calculation for completed part
      const iRLayer = new RouteLayer(); // For incomplete part of route

      // const stopsLayer = new GraphicsLayer({ title: "Interval Stops" }); // For 1000-mile markers
      webmap.addMany([rl, iRLayer, driverLayer.current]);

      const [startPoint, pickupPoint, endPoint] = createPoints([
        trip.start_coords,
        trip.pickup_coords,
        trip.end_coords,
      ]);

      // Create Stop objects for route calculation
      const [startStopLocal, pickupStop, endStopLocal] = createStops(
        [startPoint, pickupPoint, endPoint],
        [trip.pickup_location, trip.pickup_location, trip.dropoff_location]
      );
      setStartStop(startStopLocal);
      setEndStop(endStopLocal);
      setPickupStop(pickupStop);

      // Prepare marker data for main points
      const markerData = [
        {
          geometry: startPoint,
          color: "green",
          name: "Starting point of the route",
          description: `${trip.current_location}`,
        },
        {
          geometry: pickupPoint,
          color: "blue",
          name: "Pickup point of the route",
          description: `${trip.pickup_location}`,
        },
        {
          geometry: endPoint,
          color: "red",
          name: "End point of the route",
          description: `${trip.dropoff_location}`,
        },
      ];
      // Create marker graphics for main points
      const [startGraphic, pickupGraphic, endGraphic] =
        createMarkerGraphics(markerData);

      // Wait for view to be ready, then add route and graphics
      view.when(async () => {
        try {
          await rl.load();
          await iRLayer.load();
          setRouteLayer(rl);
          setIncompleteRouteLayer(iRLayer);
          // Create Point objects for the three main route points
          // Order: start -> pickup -> end
          const stopsCollection = new Collection();
          stopsCollection.addMany([startStopLocal, pickupStop, endStopLocal]);
          rl.stops = stopsCollection;

          const routeParams = {
            stops: stopsCollection,
            returnDirections: false, // Get turn-by-turn directions
            returnRoutes: true, // Get route geometry
            returnStops: true, // Get stop information
          };
          const routeResult = await rl.solve(routeParams);
          if (
            routeResult &&
            routeResult.routeInfo &&
            routeResult.routeInfo.geometry
          ) {
            const routeGeometry = routeResult.routeInfo.geometry;
            const routeGraphicLocal = new Graphic({
              geometry: routeGeometry,
              symbol: {
                type: "simple-line",
                color: "red", // red route line
                width: 2,
              },
            });
            setRouteGraphic(routeGraphicLocal);
            view.graphics.add(routeGraphicLocal); // Route line
          }

          // Add all graphics to the map
          view.graphics.addMany([startGraphic, pickupGraphic, endGraphic]); // Main points
          view.graphics.addMany(graphics); // Log entry points
          // view.graphics.add(
          //   new Graphic({
          //     geometry: driverStop.geometry,
          //     symbol: new SimpleMarkerSymbol({
          //       color: "yellow",
          //       size: 12,
          //       outline: { color: "white", width: 2 },
          //     }),
          //   })
          // );
          setErrorMsg(""); // Clear any previous error
        } catch (error) {
          // Improved error handling
          console.error("Route error details:", {
            name: error.name,
            message: error.message,
            details: error.details,
            stack: error.stack,
          });
          setErrorMsg(
            "Failed to initialize map or route. Please check your network/API key."
          );
        }
      });

      // Cleanup function: destroy map view when component unmounts
      return () => {
        if (view) {
          view.popup.visible = false;
          view.destroy();
        }
      };
    }
  }, [logsheet, trip]); // Re-run when logsheet, entries, or stops change
  useEffect(() => {
    if (!driverStop) return;

    // Update driver marker
    driverLayer.current.removeAll();
    driverLayer.current.add(
      new Graphic({
        geometry: driverStop.geometry,
        symbol: new SimpleMarkerSymbol({
          color: "yellow",
          size: 12,
          outline: { color: "white", width: 2 },
        }),
      })
    );

    // Re-solve route
    solveCompletedRoute();
  }, [driverStop, position, toggle]);
  // Render the map container
  return (
    <div style={{ position: "relative", height: "70vh", width: "100%" }}>
      <div ref={mapDiv} style={{ height: "100%", width: "100%" }} />

      {/* Toggle Pickup Stop Button */}
      <button
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 101,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: toggle ? "#007bff" : "#444",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
        onClick={() => setToggle((prev) => !prev)}
      >
        {toggle ? "Remove Pickup Stop" : "Add Pickup Stop"}
      </button>
      {/* ETA Panel */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "10px 15px",
          borderRadius: 8,
          fontFamily: "Arial",
          zIndex: 100,
        }}
      >
        <div>
          <strong>Final ETA:</strong> {etaDistToEnd.eta}
          <strong>Final Distance:</strong> {etaDistToEnd.distance.toFixed(3)} km
        </div>
        {errorMsg && (
          <div
            style={{
              marginTop: 10,
              color: "#ff5555",
              background: "rgba(0,0,0,0.5)",
              padding: "8px",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapCard;
