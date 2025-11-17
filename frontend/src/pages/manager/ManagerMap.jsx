import React, { useEffect, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { useWebSocket } from "../../hooks/useWebSocket";
import { addToast } from "@heroui/react";
import Cookies from "js-cookie";

const ManagerMap = () => {
  const mapRef = useRef();
  let view = null;
  // let graphicsLayer = null;
  // const driverMarkers = {};
  const graphicsLayerRef = useRef(null);
  const driverGraphics = useRef({});
  const managerId = Cookies.get("manager_id"); // Get manager_id from cookies
  // const { managerId } = useContext(AuthContext);
  const onOpen = () => {
    addToast({
      title: "Success",
      description: "Connection successfull",
      severity: "success",
    });
  };
  const handleMessage = (data) => {
    const { driver_id, lat, lon, name } = data;

    updateDriverMarker(driver_id, lat, lon, name);
  };

  const socketUrl = `ws://localhost:8000/ws/tracking/${managerId}/`; // Dynamic URL

  const { reconnectNow } = useWebSocket(socketUrl, handleMessage, onOpen);

  const updateDriverMarker = (driverId, lat, lon, name) => {
    if (!graphicsLayerRef.current) return;

    const point = new Point({ latitude: lat, longitude: lon });
    const symbol = new SimpleMarkerSymbol({
      color: "red",
      size: 10,
      outline: { color: "white", width: 1 },
    });

    const existing = driverGraphics.current.get(driverId);
    if (existing) graphicsLayerRef.current.remove(existing);

    const graphic = new Graphic({
      geometry: point,
      symbol: symbol,
      attributes: { driverId },
      popupTemplate: {
        title: `Driver ${name}`,
        content: "Live position",
      },
    });
    graphicsLayerRef.current.add(graphic);
    driverGraphics.current.set(driverId, graphic);
  };

  useEffect(() => {
    const map = new Map({
      basemap: "dark-gray-vector",
    });

    const graphicsLayer = new GraphicsLayer({ id: "drivers" });
    graphicsLayerRef.current = graphicsLayer;
    map.add(graphicsLayer);

    view = new MapView({
      container: mapRef.current,
      map: map,
      center: [-122.4194, 37.7749],
      zoom: 10,
    });

    return () => {
      if (view) view?.destroy();
    };
  }, [managerId]); // Re-run if managerId changes

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />
      <button
        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
        onClick={reconnectNow}
      >
        Reconnect WS
      </button>
    </div>
  );
};

export default ManagerMap;
