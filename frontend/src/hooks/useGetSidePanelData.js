import api from "../hooks/api";
import { useState, useEffect } from "react";

/**
 * Custom hook to get side panel data based on the provided API endpoint.
 * @returns {Object} - An object containing the fetched data, loading state, error state, and a refetch function.
 */
export const useGetSidePanelData = (endpoint) => {
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
      const response = await api.get(url);
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

  const refetch = () => fetchData(endpoint);
  const fetchNext = async () => {
    if (data.next) {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(data.next);
        setData((prev) => ({
          results: [...prev.results, ...response.data.results],
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };
  const fetchPrevious = () => data.previous && fetchData(data.previous);

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
