import { useState, useEffect } from "react";
import api from "./api";

// In-memory cache object to store API responses
const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds

/**
 * Custom hook to fetch panel data from API with caching
 * @param {string} apiEndpoint - The API endpoint to fetch data from
 * @returns {Object} - { data, loading, error, refetch }
 */
export function usePanelData(apiEndpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (forceRefresh = false) => {
    // Check if cached data exists and is still valid
    const cachedEntry = cache.get(apiEndpoint);
    const now = Date.now();

    if (
      !forceRefresh &&
      cachedEntry &&
      now - cachedEntry.timestamp < CACHE_DURATION
    ) {
      // Use cached data if it exists and is not expired
      setData(Array.isArray(cachedEntry.data) ? cachedEntry.data : []);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch new data if no valid cache or forceRefresh is true
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(apiEndpoint);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.data;
      const dataArray = Array.isArray(result) ? result : [];

      // Store in cache with timestamp
      cache.set(apiEndpoint, {
        data: dataArray,
        timestamp: now,
      });

      setData(dataArray);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiEndpoint) {
      fetchData();
    }
  }, [apiEndpoint]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
