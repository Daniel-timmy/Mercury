import { useState } from "react";
import api from "./api";

/**
 * Custom hook for fuel log operations.
 * @returns {Object} - An object containing fuel log functions and their states.
 */
export const useFuelLog = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createFuelLog = async (fuelLogData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post("fuel-logs/", fuelLogData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(true);
      return response.data;
    } catch (err) {
      const errorMessages = [];
      if (err.response?.data) {
        for (const key in err.response.data) {
          if (Array.isArray(err.response.data[key])) {
            errorMessages.push(`${key}: ${err.response.data[key].join(", ")}`);
          } else {
            errorMessages.push(`${key}: ${err.response.data[key]}`);
          }
        }
      } else {
        errorMessages.push(err.message || "An error occurred");
      }
      setError(errorMessages);
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createFuelLog,
    loading,
    error,
    success,
  };
};