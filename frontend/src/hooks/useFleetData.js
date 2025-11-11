import { useState, useEffect } from "react";
import api from "./api";

/**
 * Custom hook to fetch fleet data from the API.
 * @returns {Object} - An object containing fleet data, loading state, error state, and a refetch function.
 */
export const useFleetData = () => {
  const [data, setData] = useState({
    results: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url = "fleets/") => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(url);
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
  }, []);

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