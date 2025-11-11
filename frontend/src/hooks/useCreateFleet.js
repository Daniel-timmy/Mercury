import { useState } from "react";
import api from "./api";

/**
 * Custom hook to create a new fleet via the API.
 * @returns {Object} - An object containing the createFleet function, loading state, error state, and success state.
 */
export const useCreateFleet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createFleet = async (fleetData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post("fleets/", fleetData);
      setSuccess(true);
      return response.data;
    } catch (err) {
      const errorMessages = [];
      for (const key in err.response?.data) {
        errorMessages.push(`${key}: ${err.response.data[key]}`);
      }
      setError(errorMessages);
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createFleet, loading, error, success };
};