// ArcGIS Core Imports - Map visualization and routing functionality
import MapView from "@arcgis/core/views/MapView"; // Creates the interactive map view
import Map from "@arcgis/core/Map"; // Base map object
import RouteLayer from "@arcgis/core/layers/RouteLayer"; // Handles route calculation and display
import Graphic from "@arcgis/core/Graphic"; // Represents visual elements on the map
import Point from "@arcgis/core/geometry/Point"; // Geographic point coordinates
import esriConfig from "@arcgis/core/config"; // ArcGIS configuration settings
import { useRef, useEffect, useState } from "react"; // React hooks for component lifecycle
import PopupTemplate from "@arcgis/core/PopupTemplate"; // Popup information templates
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"; // Layer for custom graphics
import Polyline from "@arcgis/core/geometry/Polyline"; // Line geometry for routes
import Stop from "@arcgis/core/rest/support/Stop"; // Route stop points
import Collection from "@arcgis/core/core/Collection"; // Collection data structure
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"; // Marker symbols for points
import * as geodeticDensifyOperator from "@arcgis/core/geometry/operators/geodeticDensifyOperator.js"; // Adds points along a line
import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator.js"; // Calculates geodetic distances

// ArcGIS API key from environment variables
const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY;

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
 * @param {Array} entries - Array of log entries with coordinates and activities
 */
const MapCard = ({ logsheet, entries }) => {
  // State for managing route stops and graphics
  const [stops, setStops] = useState([]); // Collection of stop points for routing
  const [graphics, setGraphics] = useState([]); // Visual markers for log entries
  const mapDiv = useRef(null); // Reference to the map container DOM element

  /**
   * Effect: Convert log entries to route stops
   * Runs whenever entries array changes
   * Creates Stop objects from entry coordinates for route calculation
   */
  useEffect(() => {
    setStops(() => {
      // Map each log entry to a Stop object for routing
      const stops = entries.map((entry) => {
        // Create geographic point from entry coordinates
        // wkid: 4326 is the WGS84 coordinate system (standard lat/long)
        const point = new Point({
          x: entry.long, // Longitude
          y: entry.lat, // Latitude
          spatialReference: { wkid: 4326 },
        });

        // Create a Stop object for route calculation
        return new Stop({
          geometry: point,
          name: entry.location,
        });
      });
      return stops;
    });
  }, [entries]);

  /**
   * Effect: Convert log entries to visual graphics
   * Runs whenever entries array changes
   * Creates yellow markers with popup information for each entry
   */
  useEffect(() => {
    setGraphics(() => {
      // Map each log entry to a Graphic object for display
      const graphics = entries.map((entry) => {
        // Create geographic point from entry coordinates
        const point = new Point({
          x: entry.long,
          y: entry.lat,
          spatialReference: { wkid: 4326 },
        });

        // Create a visual marker graphic
        return new Graphic({
          geometry: point,
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

  /**
   * Effect: Initialize and render the map
   * Main effect that creates the map, calculates routes, and adds all graphics
   * Runs when logsheet, entries, or stops change
   */
  useEffect(() => {
    // Don't render if no logsheet data is available
    if (!logsheet) return;

    // Configure ArcGIS with API key
    esriConfig.apiKey = API_KEY;
    console.log("ArcGIS API Key set.", API_KEY);

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

      // Configure popup behavior
      view.popup.enabled = true; // Enable popups
      view.popup.autoOpenEnabled = false; // Don't auto-open on click
      view.popup.dockEnabled = true; // Allow docking to side
      view.popup.alignment = "auto"; // Auto-position popup
      view.popup.collapseEnabled = false; // Don't allow collapsing
      view.popup.actions = []; // No action buttons

      // Create layers for routing and interval stops
      const routeLayer = new RouteLayer(); // Handles route calculation
      const stopsLayer = new GraphicsLayer({ title: "Interval Stops" }); // For 1000-mile markers
      webmap.addMany([routeLayer, stopsLayer]);

      // Wait for view to be ready, then add route and graphics
      view.when(async () => {
        try {
          // Create Point objects for the three main route points

          // Starting point (current location)
          const startPoint = new Point({
            x: logsheet.start_coords.longitude,
            y: logsheet.start_coords.latitude,
            spatialReference: { wkid: 4326 },
          });

          // Pickup point
          const pickupPoint = new Point({
            x: logsheet.pickup_coords.longitude,
            y: logsheet.pickup_coords.latitude,
            spatialReference: { wkid: 4326 },
          });

          // End/dropoff point
          const endPoint = new Point({
            x: logsheet.end_coords.longitude,
            y: logsheet.end_coords.latitude,
            spatialReference: { wkid: 4326 },
          });

          // Create Stop objects for route calculation
          const startStop = new Stop({
            geometry: startPoint,
            name: logsheet.pickup_location,
          });

          const pickupStop = new Stop({
            geometry: pickupPoint,
            name: logsheet.pickup_location,
          });

          const endStop = new Stop({
            geometry: endPoint,
            name: logsheet.dropoff_location,
          });

          // Create visual graphics for the three main points

          // Green marker for starting point
          const startGraphic = new Graphic({
            geometry: startPoint,
            symbol: {
              type: "simple-marker",
              color: "green", // Green = start
              size: "12px",
            },
            attributes: {
              Name: "Starting point of the route",
              Description: `${logsheet.current_location}`,
            },
            popupTemplate: new PopupTemplate({
              title: "{Name}",
              content: "{Description}",
            }),
          });

          // Blue marker for pickup point
          const pickupGraphic = new Graphic({
            geometry: pickupPoint,
            symbol: {
              type: "simple-marker",
              color: "blue", // Blue = pickup
              size: "12px",
            },
            attributes: {
              Name: "Pickup point of the route",
              Description: `${logsheet.pickup_location}`,
            },
            popupTemplate: new PopupTemplate({
              title: "{Name}",
              content: "{Description}",
            }),
          });

          // Red marker for end/dropoff point
          const endGraphic = new Graphic({
            geometry: endPoint,
            symbol: {
              type: "simple-marker",
              color: "red", // Red = end
              size: "12px",
            },
            attributes: {
              Name: "End point of the route",
              Description: `${logsheet.dropoff_location}`,
            },
            popupTemplate: new PopupTemplate({
              title: "{Name}",
              content: "{Description}",
            }),
          });

          /**
           * Click handler for displaying popups
           * Shows information when user clicks on any marker
           */
          view.on("click", (event) => {
            // Test what was clicked on the map
            view.hitTest(event).then((response) => {
              if (response.results.length > 0) {
                // Find the first graphic that was clicked
                const graphic = response.results.find(
                  (result) => result.graphic
                )?.graphic;

                // If a graphic with a popup template was clicked, show the popup
                if (graphic && graphic.popupTemplate) {
                  view.popup.set({
                    features: [graphic],
                    location: event.mapPoint,
                    title:
                      graphic.getAttribute("Name") ||
                      graphic.getAttribute("Location") ||
                      "Point",
                    content:
                      graphic.getAttribute("Description") ||
                      graphic.getAttribute("Activity") ||
                      "No details available",
                  });
                  view.popup.visible = true;
                } else {
                  view.popup.visible = false;
                }
              } else {
                // Clicked on empty map area
                view.popup.visible = false;
              }
            });
          });

          // Create collection of all stops for route calculation
          // Order: start -> pickup -> log entries -> dropoff
          const stopsCollection = new Collection();
          stopsCollection.addMany([startStop, pickupStop, endStop]);

          // Load the route layer and set stops
          await routeLayer.load();
          console.log("RouteLayer loaded:", routeLayer.loaded);
          routeLayer.stops = stopsCollection;

          // Configure route calculation parameters
          const routeParams = {
            stops: stopsCollection,
            returnDirections: true, // Get turn-by-turn directions
            returnRoutes: true, // Get route geometry
            returnStops: true, // Get stop information
            directionLanguage: "en", // English directions
          };

          // Calculate the route
          const routeResult = await routeLayer.solve(routeParams);

          // If route calculation was successful, display it
          if (
            routeResult &&
            routeResult.routeInfo &&
            routeResult.routeInfo.geometry
          ) {
            const routeGeometry = routeResult.routeInfo.geometry;

            // Create a blue line graphic for the route
            const routeGraphic = new Graphic({
              geometry: routeGeometry,
              symbol: {
                type: "simple-line",
                color: "blue", // Blue route line
                width: 2,
              },
            });

            // Add all graphics to the map
            view.graphics.add(routeGraphic); // Route line
            view.graphics.addMany([startGraphic, pickupGraphic, endGraphic]); // Main points
            view.graphics.addMany(graphics); // Log entry points

            // Zoom map to show entire route
            view.goTo(routeGeometry);

            // Load geodetic operators for distance calculations
            if (!geodeticDensifyOperator.isLoaded()) {
              await geodeticDensifyOperator.load();
            }
            if (!geodeticLengthOperator.isLoaded()) {
              await geodeticLengthOperator.load();
            }

            /**
             * Function: Add interval stops along the route
             * Creates markers at regular distance intervals for refueling/rest stops
             *
             * @param {Polyline} polyline - The route geometry
             * @param {number} intervalMiles - Distance between stops (default 500 miles)
             */
            const addStopsAtIntervals = (polyline, intervalMiles = 500) => {
              // Calculate total route distance in miles
              const totalMiles = geodeticLengthOperator.execute(polyline, {
                unit: "miles",
              });

              // Skip if route is shorter than one interval
              if (totalMiles <= intervalMiles) {
                return;
              }

              // Densify the polyline to add more points for accurate interpolation
              // Adds points every 100 miles along the route
              const densifiedPolyline = geodeticDensifyOperator.execute(
                polyline,
                100,
                { unit: "miles" }
              );
              if (!densifiedPolyline) {
                console.error("Failed to densify polyline.");
                return;
              }

              // Generate array of distances where stops should be placed
              // Example: for 2500 mile route with 500 mile intervals: [500, 1000, 1500, 2000]
              const intervals = [];
              for (
                let dist = intervalMiles;
                dist < totalMiles;
                dist += intervalMiles
              ) {
                intervals.push(dist);
              }

              // Create a marker at each interval distance
              intervals.forEach((dist, index) => {
                const point = interpolatePointAlongPolyline(
                  densifiedPolyline,
                  dist
                );
                if (point) {
                  // Create red circular marker for interval stop
                  const stopGraphic = new Graphic({
                    geometry: point,
                    symbol: new SimpleMarkerSymbol({
                      style: "circle",
                      color: "red", // Red for interval stops
                      size: 8,
                      outline: { color: "white", width: 1 },
                    }),
                    attributes: {
                      Name: `Stop at ${dist} miles`,
                      Description: `Interval stop ${
                        index + 1
                      } at ${dist.toFixed(1)} miles for refueling/rest`,
                    },
                    popupTemplate: new PopupTemplate({
                      title: "{Name}",
                      content: "{Description}",
                    }),
                  });
                  stopsLayer.add(stopGraphic);
                }
              });
            };

            /**
             * Helper Function: Interpolate point at a specific distance along route
             * Walks through the polyline segments to find the exact point at a given distance
             *
             * @param {Polyline} polyline - The route geometry
             * @param {number} distanceMiles - Target distance from start
             * @returns {Point|null} - The interpolated point or null if not found
             */
            const interpolatePointAlongPolyline = (polyline, distanceMiles) => {
              let cumulativeMiles = 0; // Running total of distance traveled
              const paths = polyline.paths;

              // Iterate through each path in the polyline
              for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
                const path = paths[pathIndex];

                // Iterate through each segment in the path
                for (let i = 1; i < path.length; i++) {
                  // Create points for segment start and end
                  const startPt = new Point({
                    x: path[i - 1][0],
                    y: path[i - 1][1],
                    spatialReference: polyline.spatialReference,
                  });
                  const endPt = new Point({
                    x: path[i][0],
                    y: path[i][1],
                    spatialReference: polyline.spatialReference,
                  });

                  // Create polyline segment for distance calculation
                  const segment = new Polyline({
                    paths: [[path[i - 1], path[i]]],
                    spatialReference: polyline.spatialReference,
                  });

                  // Calculate segment length
                  const segmentMiles = geodeticLengthOperator.execute(segment, {
                    unit: "miles",
                  });

                  // Check if target distance falls within this segment
                  if (cumulativeMiles + segmentMiles >= distanceMiles) {
                    // Calculate how far into this segment the point should be
                    const remaining = distanceMiles - cumulativeMiles;
                    const ratio = remaining / segmentMiles;

                    // Linear interpolation to find exact coordinates
                    const interpX = startPt.x + (endPt.x - startPt.x) * ratio;
                    const interpY = startPt.y + (endPt.y - startPt.y) * ratio;

                    return new Point({
                      x: interpX,
                      y: interpY,
                      spatialReference: polyline.spatialReference,
                    });
                  }
                  cumulativeMiles += segmentMiles;
                }
              }
              return null; // Point not found (shouldn't happen if distance < total)
            };

            // Add interval stops every 1000 miles along the route
            addStopsAtIntervals(routeGeometry, 1000);
          } else {
            // Route calculation failed
            console.error(
              "No valid route geometry found in result:",
              routeResult
            );
          }
        } catch (error) {
          // Handle any errors during route calculation or rendering
          console.error("Route error details:", {
            name: error.name,
            message: error.message,
            details: error.details,
            stack: error.stack,
          });
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
  }, [logsheet, entries, stops]); // Re-run when logsheet, entries, or stops change

  // Render the map container
  return (
    <div
      className="mapDiv "
      ref={mapDiv}
      style={{ height: "70vh", width: "100%" }}
    ></div>
  );
};

export default MapCard;
