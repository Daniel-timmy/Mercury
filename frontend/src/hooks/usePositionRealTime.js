import { useEffect, useState, useRef } from "react";
import api from "../hooks/api";
import Cookies from "js-cookie";

function calculateDistance(lat1, lon1, lat2, lon2, unit = "km") {
  const R = unit === "miles" ? 3959 : 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const usePositionRealTime = () => {
  const driverId = Cookies.get("driver_id");
  const [position, setPosition] = useState({
    latitude: null,
    longitude: null,
    timestamp: null,
    driver_id: driverId || null,
  });
  const [distanceMoved, setDistanceMoved] = useState(null);

  const lastPositionRef = useRef(null); // track last sent position
  const lastUpdateTimeRef = useRef(null); // last successful update time
  const intervalRef = useRef(null);
  const lockKey = `tracking_lock_${driverId}`;

  // Lock mechanism to prevent multiple tabs
  const acquireLock = () => {
    if (!driverId) return false;
    const now = Date.now();
    const existing = localStorage.getItem(lockKey);
    if (!existing || now - parseInt(existing) > 30000) {
      localStorage.setItem(lockKey, now.toString());
      return true;
    }
    return false;
  };

  const releaseLock = () => {
    localStorage.removeItem(lockKey);
  };

  useEffect(() => {
    if (!driverId) {
      console.log("No driver_id, skipping position tracking");
      return;
    }

    if (!acquireLock()) {
      console.log("Another tab is already tracking");
      return;
    }

    const sendPositionUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        async (geoPosition) => {
          // const { latitude, longitude } = geoPosition.coords;
          const latitude = 42.390661;
          const longitude = -113.280577;

          const newPos = {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            driver_id: driverId,
          };
          // const newPos = {
          //   latitude,
          //   longitude,
          //   timestamp: new Date().toISOString(),
          //   driver_id: driverId,
          // };

          let moved = 0;
          if (lastPositionRef.current) {
            moved = calculateDistance(
              lastPositionRef.current.latitude,
              lastPositionRef.current.longitude,
              latitude,
              longitude
            );
          }

          setDistanceMoved(moved);
          console.log(
            "Distance moved since last update:",
            moved.toFixed(4),
            "km"
          );

          // Only send if moved more than 0.05 km (~50 meters) OR every 5 minutes
          const now = Date.now();
          const timeSinceLastUpdate = lastUpdateTimeRef.current
            ? (now - lastUpdateTimeRef.current) / 1000
            : Infinity;

          const shouldSend = moved >= 0.05 || timeSinceLastUpdate > 3; // 50m or 5min

          if (shouldSend) {
            try {
              // console.log("Sending position update...", newPos);
              await api.post("trip/driver-positions/", {
                ...newPos,
                distance_moved: moved,
              });

              // Update refs only on success
              lastPositionRef.current = { latitude, longitude };
              lastUpdateTimeRef.current = now;
              setPosition(newPos); // update state for consumers
              // console.log("Position update sent successfully");
            } catch (err) {
              console.error("Failed to send position:", err);
            }
          } else {
            // console.log("Not enough movement or time passed. Skipping send.");
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    };

    // Start interval
    console.log("Starting position tracking (every 10s)");
    intervalRef.current = setInterval(sendPositionUpdate, 10000); // every 10 seconds

    // Optional: send immediately on load
    sendPositionUpdate();

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      releaseLock();
    };
  }, [driverId]); // Only re-run if driverId changes

  return {
    position,
    distanceMoved, // this will now update correctly
    isTracking: !!intervalRef.current,
  };
};

export default usePositionRealTime;
// import { useEffect, useState, useRef } from "react";
// import api from "../hooks/api";
// import Cookies from "js-cookie";

// function calculateDistance(lat1, lon1, lat2, lon2, unit = "km") {
//   const R = unit === "miles" ? 3959 : 6371;

//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) *
//       Math.cos(lat2 * (Math.PI / 180)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   const distance = R * c;

//   return distance;
// }

// /**
//  * Custom hook to get and send real-time position updates for a given trip.
//  * @param {string} tripId - The ID of the trip to send position updates for.
//  * @returns {Object} - The current position with latitude and longitude.
//  */
// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// const usePositionRealTime = () => {
//   const [position, setPosition] = useState(null);
//   const driverId = Cookies.get("driver_id");
//   const intervalRef = useRef(null);
//   const lockKey = `tracking_lock_${driverId}`;
//   const coords = [
//     [9.886892, 4.501176],
//     [9.05785, 7.49508],
//     [10.3157, 6.5244],
//     [11.2027, 7.192],
//     [12.0022, 8.5919],
//     [13.1621, 7.197],
//   ];
//   let coordIndex = getRandomInt(0, coords.length - 1);

//   useEffect(() => {
//     if (!driverId) return;

//     const acquireLock = () => {
//       const now = Date.now();
//       const lock = localStorage.getItem(lockKey);
//       if (!lock || now - parseInt(lock) > 30000) {
//         // 30s TTL for stale locks
//         localStorage.setItem(lockKey, now.toString());
//         return true; // Acquired
//       }
//       return false; // Locked by another tab
//     };
//     const releaseLock = () => {
//       localStorage.removeItem(lockKey);
//     };
//     const sendPositionUpdate = async () => {
//       if (!driverId) return;
//       console.log("Driver ID:", driverId);
//       console.log("Position:", position);

//       navigator.geolocation.getCurrentPosition((pos) => {
//         if (!pos) return;

//         // if (position) {
//         //   const distance = calculateDistance(
//         //     position.latitude,
//         //     position.longitude,
//         //     pos.coords.latitude,
//         //     pos.coords.longitude
//         //   );

//         //   if (distance < 5) return; // Only update if moved more than 5 kilometers
//         // }

//         setPosition({
//           driver_id: driverId,
//           latitude: coords[coordIndex][0],
//           longitude: coords[coordIndex][1],
//           timestamp: new Date().toISOString(),
//           // trip_id: tripId,
//         });
//         // setPosition({
//         //   driver_id: driverId,
//         //   latitude: pos.coords.latitude,
//         //   longitude: pos.coords.longitude,
//         //   timestamp: new Date().toISOString(),
//         //   // trip_id: tripId,
//         // });
//       });
//       const response = await api.post(`trip/driver-positions/`, position);
//       console.log("Position update response:", response.data);
//     };
//     console.log("Attempting to acquire lock for tracking");
//     if (!acquireLock()) {
//       console.log("Another tab is tracking; skipping");
//       return;
//     }
//     console.log("Lock acquired for tracking");
//     intervalRef.current = setInterval(sendPositionUpdate, 6000); // Update every 60 seconds
//     console.log("Interval set for position updates");
//     const handleStorage = (e) => {
//       if (e.key === lockKey && !localStorage.getItem(lockKey)) {
//         clearInterval(intervalRef.current); // Other tab released; we could re-acquire
//       }
//     };
//     window.addEventListener("storage", handleStorage);

//     return () => {
//       clearInterval(intervalRef.current);
//       window.removeEventListener("storage", handleStorage);
//       releaseLock();
//     };
//   }, [position]);

//   return position;
// };

// export default usePositionRealTime;

// import { useEffect, useState, useRef } from "react";
// import api from "../hooks/api";
// import Cookies from "js-cookie";

// function calculateDistance(lat1, lon1, lat2, lon2, unit = "km") {
//   const R = unit === "miles" ? 3959 : 6371;

//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) *
//       Math.cos(lat2 * (Math.PI / 180)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   const distance = R * c;

//   return distance;
// }
// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// /**
//  * Custom hook to get and send real-time position updates for a given trip.
//  * @param {string} tripId - The ID of the trip to send position updates for.
//  * @returns {Object} - The current position with latitude and longitude.
//  */

// const usePositionRealTime = () => {
//   const [position, setPosition] = useState(null);
//   const [distance, setDistance] = useState(0);
//   const driverId = Cookies.get("driver_id");
//   const intervalRef = useRef(null);
//   const lockKey = `tracking_lock_${driverId}`;
//   const coords = [
//     [9.886892, 4.501176],
//     [9.05785, 7.49508],
//     [10.3157, 6.5244],
//     [11.2027, 7.192],
//     [12.0022, 8.5919],
//     [13.1621, 7.197],
//   ];
//   let coordIndex = getRandomInt(0, coords.length - 1);

//   useEffect(() => {
//     if (!driverId) return;

//     const acquireLock = () => {
//       const now = Date.now();
//       const lock = localStorage.getItem(lockKey);
//       if (!lock || now - parseInt(lock) > 30000) {
//         // 30s TTL for stale locks
//         localStorage.setItem(lockKey, now.toString());
//         return true; // Acquired
//       }
//       return false; // Locked by another tab
//     };
//     const releaseLock = () => {
//       localStorage.removeItem(lockKey);
//     };
//     const sendPositionUpdate = async () => {
//       if (!driverId) return;
//       console.log("Driver ID:", driverId);
//       console.log("Position:", position);
//       setPosition({
//         driver_id: driverId,
//         latitude: coords[coordIndex][0],
//         longitude: coords[coordIndex][1],
//         timestamp: new Date().toISOString(),
//         // trip_id: tripId,
//       });

//       navigator.geolocation.getCurrentPosition((pos) => {
//         if (!pos) return;

//         if (position) {
//           setDistance(
//             calculateDistance(
//               position.latitude,
//               position.longitude,
//               pos.coords.latitude,
//               pos.coords.longitude
//             )
//           );
//           console.log("Distance moved (km):", distance);

//           if (distance < 5) {
//             console.log("Moved less than 5 km, not updating position.");
//             return; // Only update if moved more than 5 kilometers
//           }
//         }
//         console.log("After Distance moved (km):", distance);

//         // setPosition({
//         //   driver_id: driverId,
//         //   latitude: pos.coords.latitude,
//         //   longitude: pos.coords.longitude,
//         //   timestamp: new Date().toISOString(),
//         //   // trip_id: tripId,
//         // });
//         setPosition({
//           driver_id: driverId,
//           latitude: coords[coordIndex][0],
//           longitude: coords[coordIndex][1],
//           timestamp: new Date().toISOString(),
//           // trip_id: tripId,
//         });
//       });
//       if (distance >= 5 || !position) {
//         console.log("Sending position update to server.");
//         const response = await api.post(`trip/driver-positions/`, position);
//       }
//     };
//     console.log("Attempting to acquire lock for tracking");
//     if (!acquireLock()) {
//       console.log("Another tab is tracking; skipping");
//       return;
//     }
//     intervalRef.current = setInterval(sendPositionUpdate, 6000); // Update every 60 seconds
//     const handleStorage = (e) => {
//       if (e.key === lockKey && !localStorage.getItem(lockKey)) {
//         clearInterval(intervalRef.current); // Other tab released; we could re-acquire
//       }
//     };
//     window.addEventListener("storage", handleStorage);

//     return () => {
//       clearInterval(intervalRef.current);
//       window.removeEventListener("storage", handleStorage);
//       releaseLock();
//     };
//   }, [position]);

//   return position;
// };

// export default usePositionRealTime;
