// view.when(async () => {
//   try {
//     // Create Point objects for the three main route points
//     const [startPoint, pickupPoint, endPoint] = createPoints([
//       trip.start_coords,
//       trip.pickup_coords,
//       trip.end_coords,
//     ]);

//     // Create Stop objects for route calculation
//     const [startStop, pickupStop, endStop] = createStops(
//       [startPoint, pickupPoint, endPoint],
//       [trip.pickup_location, trip.pickup_location, trip.dropoff_location]
//     );

//     // Prepare marker data for main points
//     const markerData = [
//       {
//         geometry: startPoint,
//         color: "green",
//         name: "Starting point of the route",
//         description: `${trip.current_location}`,
//       },
//       {
//         geometry: pickupPoint,
//         color: "blue",
//         name: "Pickup point of the route",
//         description: `${trip.pickup_location}`,
//       },
//       {
//         geometry: endPoint,
//         color: "red",
//         name: "End point of the route",
//         description: `${trip.dropoff_location}`,
//       },
//     ];
//     // Create marker graphics for main points
//     const [startGraphic, pickupGraphic, endGraphic] =
//       createMarkerGraphics(markerData);

//     /**
//      * Click handler for displaying popups
//      * Shows information when user clicks on any marker
//      */
//     // view.on("click", (event) => {
//     //   // Test what was clicked on the map
//     //   view.hitTest(event).then((response) => {
//     //     if (response.results.length > 0) {
//     //       // Find the first graphic that was clicked
//     //       const graphic = response.results.find(
//     //         (result) => result.graphic
//     //       )?.graphic;

//     //       // If a graphic with a popup template was clicked, show the popup
//     //       if (graphic && graphic.popupTemplate) {
//     //         view.popup.set({
//     //           features: [graphic],
//     //           location: event.mapPoint,
//     //           title:
//     //             graphic.getAttribute("Name") ||
//     //             graphic.getAttribute("Location") ||
//     //             "Point",
//     //           content:
//     //             graphic.getAttribute("Description") ||
//     //             graphic.getAttribute("Activity") ||
//     //             "No details available",
//     //         });
//     //         view.popup.visible = true;
//     //       } else {
//     //         view.popup.visible = false;
//     //       }
//     //     } else {
//     //       // Clicked on empty map area
//     //       view.popup.visible = false;
//     //     }
//     //   });
//     // });

//     // Create collection of all stops for route calculation
//     // Order: start -> pickup -> log entries -> dropoff
//     const completedStopsCollection = new Collection();
//     completedStopsCollection.addMany([startStop, ...stops, driverStop]);

//     // Load the route layer and set stops
//     // await routeLayer.load();
//     // console.log("RouteLayer loaded:", routeLayer.loaded);
//     // routeLayer.stops = completedStopsCollection;

//     // // Configure route calculation parameters
//     // const routeParams = {
//     //   stops: completedStopsCollection,
//     //   returnDirections: true, // Get turn-by-turn directions
//     //   returnRoutes: true, // Get route geometry
//     //   returnStops: true, // Get stop information
//     //   directionLanguage: "en", // English directions
//     // };

//     // // Calculate the route
//     // const routeResult = await routeLayer.solve(routeParams);

//     // // If route calculation was successful, display it
//     // if (
//     //   routeResult &&
//     //   routeResult.routeInfo &&
//     //   routeResult.routeInfo.geometry
//     // ) {
//     //   const routeGeometry = routeResult.routeInfo.geometry;

//     //   // Create a blue line graphic for the route
//     //   const routeGraphic = new Graphic({
//     //     geometry: routeGeometry,
//     //     symbol: {
//     //       type: "simple-line",
//     //       color: "blue", // Blue route line
//     //       width: 2,
//     //     },
//     //   });

//     // Add all graphics to the map
//     // view.graphics.add(routeGraphic); // Route line
//     view.graphics.addMany([startGraphic, pickupGraphic, endGraphic]); // Main points
//     view.graphics.addMany(graphics); // Log entry points

//     // Zoom map to show entire route this should zoom to show incompeted journey
//     view.goTo(routeGeometry);

//     // // Load geodetic operators for distance calculations
//     // if (!geodeticDensifyOperator.isLoaded()) {
//     //   await geodeticDensifyOperator.load();
//     // }
//     // if (!geodeticLengthOperator.isLoaded()) {
//     //   await geodeticLengthOperator.load();
//     // }

//     // /**
//     //  * Function: Add interval stops along the route
//     //  * Creates markers at regular distance intervals for refueling/rest stops
//     //  *
//     //  * @param {Polyline} polyline - The route geometry
//     //  * @param {number} intervalMiles - Distance between stops (default 500 miles)
//     //  */
//     // const addStopsAtIntervals = (polyline, intervalMiles = 500) => {
//     //   // Calculate total route distance in miles
//     //   const totalMiles = geodeticLengthOperator.execute(polyline, {
//     //     unit: "miles",
//     //   });

//     //   // Skip if route is shorter than one interval
//     //   if (totalMiles <= intervalMiles) {
//     //     return;
//     //   }

//     //   // Densify the polyline to add more points for accurate interpolation
//     //   // Adds points every 100 miles along the route
//     //   const densifiedPolyline = geodeticDensifyOperator.execute(
//     //     polyline,
//     //     100,
//     //     { unit: "miles" }
//     //   );
//     //   if (!densifiedPolyline) {
//     //     console.error("Failed to densify polyline.");
//     //     return;
//     //   }

//     //   // Generate array of distances where stops should be placed
//     //   // Example: for 2500 mile route with 500 mile intervals: [500, 1000, 1500, 2000]
//     //   const intervals = [];
//     //   for (
//     //     let dist = intervalMiles;
//     //     dist < totalMiles;
//     //     dist += intervalMiles
//     //   ) {
//     //     intervals.push(dist);
//     //   }

//     //   // Create a marker at each interval distance
//     //   intervals.forEach((dist, index) => {
//     //     const point = interpolatePointAlongPolyline(
//     //       densifiedPolyline,
//     //       dist
//     //     );
//     //     if (point) {
//     //       // Create red circular marker for interval stop
//     //       const stopGraphic = new Graphic({
//     //         geometry: point,
//     //         symbol: new SimpleMarkerSymbol({
//     //           style: "circle",
//     //           color: "red", // Red for interval stops
//     //           size: 8,
//     //           outline: { color: "white", width: 1 },
//     //         }),
//     //         attributes: {
//     //           Name: `Stop at ${dist} miles`,
//     //           Description: `Interval stop ${
//     //             index + 1
//     //           } at ${dist.toFixed(1)} miles for refueling/rest`,
//     //         },
//     //         popupTemplate: new PopupTemplate({
//     //           title: "{Name}",
//     //           content: "{Description}",
//     //         }),
//     //       });
//     //       stopsLayer.add(stopGraphic);
//     //     }
//     //   });
//     // };

//     // /**
//     //  * Helper Function: Interpolate point at a specific distance along route
//     //  * Walks through the polyline segments to find the exact point at a given distance
//     //  *
//     //  * @param {Polyline} polyline - The route geometry
//     //  * @param {number} distanceMiles - Target distance from start
//     //  * @returns {Point|null} - The interpolated point or null if not found
//     //  */
//     // const interpolatePointAlongPolyline = (polyline, distanceMiles) => {
//     //   let cumulativeMiles = 0; // Running total of distance traveled
//     //   const paths = polyline.paths;

//     //   // Iterate through each path in the polyline
//     //   for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
//     //     const path = paths[pathIndex];

//     //     // Iterate through each segment in the path
//     //     for (let i = 1; i < path.length; i++) {
//     //       // Create points for segment start and end
//     //       const startPt = new Point({
//     //         x: path[i - 1][0],
//     //         y: path[i - 1][1],
//     //         spatialReference: polyline.spatialReference,
//     //       });
//     //       const endPt = new Point({
//     //         x: path[i][0],
//     //         y: path[i][1],
//     //         spatialReference: polyline.spatialReference,
//     //       });

//     //       // Create polyline segment for distance calculation
//     //       const segment = new Polyline({
//     //         paths: [[path[i - 1], path[i]]],
//     //         spatialReference: polyline.spatialReference,
//     //       });

//     //       // Calculate segment length
//     //       const segmentMiles = geodeticLengthOperator.execute(segment, {
//     //         unit: "miles",
//     //       });

//     //       // Check if target distance falls within this segment
//     //       if (cumulativeMiles + segmentMiles >= distanceMiles) {
//     //         // Calculate how far into this segment the point should be
//     //         const remaining = distanceMiles - cumulativeMiles;
//     //         const ratio = remaining / segmentMiles;

//     //         // Linear interpolation to find exact coordinates
//     //         const interpX = startPt.x + (endPt.x - startPt.x) * ratio;
//     //         const interpY = startPt.y + (endPt.y - startPt.y) * ratio;

//     //         return new Point({
//     //           x: interpX,
//     //           y: interpY,
//     //           spatialReference: polyline.spatialReference,
//     //         });
//     //       }
//     //       cumulativeMiles += segmentMiles;
//     //     }
//     //   }
//     //   return null; // Point not found (shouldn't happen if distance < total)
//     // };

//     // Add interval stops every 1000 miles along the route
//     // addStopsAtIntervals(routeGeometry, 1000);
//     // } else {
//     //   // Route calculation failed
//     //   console.error(
//     //     "No valid route geometry found in result:",
//     //     routeResult
//     //   );
//     // }
//   } catch (error) {
//     // Handle any errors during route calculation or rendering
//     console.error("Route error details:", {
//       name: error.name,
//       message: error.message,
//       details: error.details,
//       stack: error.stack,
//     });
//   }
// });
