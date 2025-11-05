import { useState, useEffect } from "react";
import api from "../hooks/api";

/**
 * Custom hook to fetch personnel data from the API.
 * @param {string|null} endpoint - The API endpoint to fetch personnel data from.
 * @returns {Object} - An object containing personnel data, loading state, error state, and a refetch function.
 */
export const usePersonnelData = (endpoint) => {
  const [data, setData] = useState({
    results: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url = endpoint) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`users/${url}/`);
      setData({
        results: response.data.results,
        count: response.data.count,
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
    fetchData(endpoint);
  }, [endpoint]);

  const refetch = () => {
    fetchData(endpoint);
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
