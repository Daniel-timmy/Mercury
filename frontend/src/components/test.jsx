// import MapView from "@arcgis/core/views/MapView";
// import Map from "@arcgis/core/Map";
// import RouteLayer from "@arcgis/core/layers/RouteLayer";
// import Graphic from "@arcgis/core/Graphic";
// import Point from "@arcgis/core/geometry/Point";
// import esriConfig from "@arcgis/core/config";
// import { useRef, useEffect, useState, useCallback } from "react";
// import PopupTemplate from "@arcgis/core/PopupTemplate";
// import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
// import Polyline from "@arcgis/core/geometry/Polyline";
// import Stop from "@arcgis/core/rest/support/Stop";
// import Collection from "@arcgis/core/core/Collection";
// import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
// import * as geodeticDensifyOperator from "@arcgis/core/geometry/operators/geodeticDensifyOperator.js";
// import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator.js";
// import watchUtils from "@arcgis/core/core/watchUtils";

// const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY;

// const MapCard = ({ logsheet, trip, entries, driverPosition }) => {
//   const mapDiv = useRef(null);
//   const [routeLayer, setRouteLayer] = (useState < RouteLayer) | (null > null);
//   const [driverLayer] = useState(new GraphicsLayer());
//   const [nextStopLayer] = useState(new GraphicsLayer());
//   const viewRef = useRef(null);

//   // Driver position from WebSocket: { lat, lon }
//   const [currentDriverPos, setCurrentDriverPos] =
//     (useState < Point) | (null > null);

//   // ETA state
//   const [etaToNext, setEtaToNext] = useState < string > "";
//   const [etaToEnd, setEtaToEnd] = useState < string > "";

//   // === 1. Update driver position from WebSocket ===
//   useEffect(() => {
//     if (driverPosition) {
//       const point = new Point({
//         latitude: driverPosition.lat,
//         longitude: driverPosition.lon,
//         spatialReference: { wkid: 4326 },
//       });
//       setCurrentDriverPos(point);
//     }
//   }, [driverPosition]);

//   // === 2. Reusable: Solve Route ===
//   const solveRoute = useCallback(async () => {
//     if (!routeLayer || !currentDriverPos || !viewRef.current) return;

//     try {
//       const stops = new Collection();

//       // 1. Current driver location (dynamic start)
//       stops.add(
//         new Stop({
//           geometry: currentDriverPos,
//           name: "Current Location",
//         })
//       );

//       // 2. Pickup (if not passed)
//       if (trip.pickup_coords) {
//         stops.add(
//           new Stop({
//             geometry: new Point({
//               x: trip.pickup_coords.longitude,
//               y: trip.pickup_coords.latitude,
//               spatialReference: { wkid: 4326 },
//             }),
//             name: trip.pickup_location,
//           })
//         );
//       }

//       // 3. Log entries (in order)
//       entries.forEach((entry) => {
//         stops.add(
//           new Stop({
//             geometry: new Point({
//               x: entry.long,
//               y: entry.lat,
//               spatialReference: { wkid: 4326 },
//             }),
//             name: entry.location,
//           })
//         );
//       });

//       // 4. Final dropoff
//       stops.add(
//         new Stop({
//           geometry: new Point({
//             x: trip.end_coords.longitude,
//             y: trip.end_coords.latitude,
//             spatialReference: { wkid: 4326 },
//           }),
//           name: trip.dropoff_location,
//         })
//       );

//       routeLayer.stops = stops;

//       const result = await routeLayer.solve({
//         stops,
//         returnDirections: true,
//         returnRoutes: true,
//       });

//       if (result?.routeInfo?.geometry) {
//         // === Update route line ===
//         const routeLine = new Graphic({
//           geometry: result.routeInfo.geometry,
//           symbol: { type: "simple-line", color: "blue", width: 3 },
//         });
//         viewRef.current.graphics.removeAll();
//         viewRef.current.graphics.add(routeLine);

//         // === ETA Calculations ===
//         const directions = result.directions;
//         if (directions?.features) {
//           const totalMinutes = directions.totalTime;
//           setEtaToEnd(formatETA(totalMinutes));

//           // ETA to next stop (first unvisited)
//           const nextStop = directions.features.find(
//             (f) => !f.attributes.arrivalTime
//           );
//           if (nextStop) {
//             setEtaToNext(formatETA(nextStop.attributes.time));
//             highlightNextStop(nextStop.geometry);
//           }
//         }

//         // === Zoom to route ===
//         viewRef.current.goTo(result.routeInfo.geometry);
//       }
//     } catch (err) {
//       console.error("Route solve failed:", err);
//     }
//   }, [routeLayer, currentDriverPos, trip, entries]);

//   // === 3. Watch driver position → re-solve ===
//   useEffect(() => {
//     if (!currentDriverPos || !routeLayer) return;

//     // Update driver marker
//     driverLayer.removeAll();
//     driverLayer.add(
//       new Graphic({
//         geometry: currentDriverPos,
//         symbol: new SimpleMarkerSymbol({
//           color: "red",
//           size: 12,
//           outline: { color: "white", width: 2 },
//         }),
//       })
//     );

//     // Re-solve route
//     solveRoute();
//   }, [currentDriverPos, routeLayer, solveRoute]);

//   // === 4. Initialize Map ===
//   useEffect(() => {
//     if (!logsheet || !trip) return;

//     esriConfig.apiKey = API_KEY;

//     const map = new Map({ basemap: "dark-gray-vector" });
//     const view = new MapView({
//       container: mapDiv.current,
//       map,
//       center: [-117.149, 32.7353],
//       scale: 10000000,
//     });
//     viewRef.current = view;

//     const rl = new RouteLayer();
//     map.addMany([rl, driverLayer, nextStopLayer]);
//     setRouteLayer(rl);

//     view.when(() => {
//       // Initial solve with static start
//       const initialPoint = new Point({
//         x: trip.start_coords.longitude,
//         y: trip.start_coords.latitude,
//         spatialReference: { wkid: 4326 },
//       });
//       setCurrentDriverPos(initialPoint);
//     });

//     return () => {
//       view.destroy();
//     };
//   }, [logsheet, trip]);

//   // === Helper: Format minutes → "2h 15m" ===
//   const formatETA = (minutes) => {
//     if (!minutes) return "--";
//     const h = Math.floor(minutes / 60);
//     const m = Math.round(minutes % 60);
//     return h > 0 ? `${h}h ${m}m` : `${m}m`;
//   };

//   // === Highlight next stop ===
//   const highlightNextStop = (geometry) => {
//     nextStopLayer.removeAll();
//     nextStopLayer.add(
//       new Graphic({
//         geometry,
//         symbol: new SimpleMarkerSymbol({
//           style: "circle",
//           color: "yellow",
//           size: 16,
//           outline: { color: "orange", width: 3 },
//         }),
//       })
//     );
//   };

//   // === Render ETA Panel ===
//   return (
//     <div style={{ position: "relative", height: "70vh", width: "100%" }}>
//       <div ref={mapDiv} style={{ height: "100%", width: "100%" }} />

//       {/* ETA Panel */}
//       <div
//         style={{
//           position: "absolute",
//           top: 10,
//           left: 10,
//           background: "rgba(0,0,0,0.7)",
//           color: "white",
//           padding: "10px 15px",
//           borderRadius: 8,
//           fontFamily: "Arial",
//           zIndex: 100,
//         }}
//       >
//         <div>
//           <strong>Next Stop:</strong> {etaToNext}
//         </div>
//         <div>
//           <strong>Final ETA:</strong> {etaToEnd}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MapCard;
