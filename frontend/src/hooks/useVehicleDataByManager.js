import { useState, useEffect } from "react";
import api from "./api";

/**
 * Custom hook to fetch vehicle data filtered by manager ID.
 * @param {string|null} managerId - The manager ID to filter vehicles by.
 * @returns {Object} - An object containing vehicle data, loading state, error state, and a refetch function.
 */
export const useVehicleDataByManager = (managerId) => {
  const [data, setData] = useState({
    results: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url = null) => {
    if (!managerId) {
      setData({ results: [], count: 0, next: null, previous: null });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = url || `vehicles/?manager=${managerId}`;
      const response = await api.get(endpoint);
      setData({
        results: response.data.results || response.data,
        count: response.data.count || response.data.length,
        next: response.data.next,
        previous: response.data.previous,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [managerId]);

  const refetch = () => {
    fetchData();
  };

  const fetchNext = () => {
    if (data.next) fetchData(data.next);
  };

  const fetchPrevious = () => {
    if (data.previous) fetchData(data.previous);
  };

  return {
    results: data.results,
    count: data.count,
    next: data.next,
    previous: data.previous,
    loading,
    error,
    refetch,
    fetchNext,
    fetchPrevious,
  };
};