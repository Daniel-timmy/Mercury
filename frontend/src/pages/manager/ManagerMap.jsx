import React, { useEffect, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Cookies from "js-cookie";

const ManagerMap = () => {
  const mapRef = useRef();
  let view = null;
  let graphicsLayer = null;
  const driverMarkers = {};
  const managerId = Cookies.get("manager_id"); // Get manager_id from cookies
  // const { managerId } = useContext(AuthContext); // Example: Get from auth (e.g., 1 for Manager 1)

  useEffect(() => {
    // Use imported modules directly
    const map = new Map({
      basemap: "dark-gray-vector",
    });

    // Add routes layer (could filter by manager if needed)
    // const routesLayer = new FeatureLayer({
    //   url: "https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/Routes/FeatureServer/0",
    // });
    // map.add(routesLayer);

    graphicsLayer = new GraphicsLayer({ id: "drivers" });
    map.add(graphicsLayer);

    view = new MapView({
      container: mapRef.current,
      map: map,
      center: [-122.4194, 37.7749],
      zoom: 10,
    });

    // Manager-specific WebSocket
    const socketUrl = `ws://localhost:8000/ws/tracking/${managerId}/`; // Dynamic URL
    const socket = new WebSocket(socketUrl);

    socket.onopen = () =>
      console.log("WebSocket connected for manager " + managerId);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { driver_id, lat, lon, name } = data;
      console.log("Received position for driver:", driver_id, lat, lon);

      const point = new Point({ latitude: lat, longitude: lon });
      const symbol = new SimpleMarkerSymbol({
        color: "red",
        size: 10,
        outline: { color: "white", width: 1 },
      });
      const graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: { driver_id },
        popupTemplate: {
          title: `Driver ${name}`,
          content: "Live position",
        },
      });

      if (driverMarkers[driver_id]) {
        graphicsLayer.remove(driverMarkers[driver_id]);
      }
      graphicsLayer.add(graphic);
      driverMarkers[driver_id] = graphic;
    };

    socket.onclose = () => console.log("WebSocket closed");

    return () => {
      socket.close();
      if (view) view.destroy();
    };
  }, [managerId]); // Re-run if managerId changes

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
};

export default ManagerMap;
