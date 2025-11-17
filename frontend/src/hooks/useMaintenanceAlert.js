import { useState } from "react";
import api from "./api";

/**
 * Custom hook for maintenance alert operations.
 * @returns {Object} - An object containing maintenance alert functions and their states.
 */
export const useMaintenanceAlert = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createMaintenanceAlert = async (alertData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post("maintenance-alerts/", alertData);
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

  const updateMaintenanceAlert = async (alertId, alertData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.patch(`maintenance-alerts/${alertId}/`, alertData);
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

  const deleteMaintenanceAlert = async (alertId) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.delete(`maintenance-alerts/${alertId}/`);
      setSuccess(true);
      return true;
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
    createMaintenanceAlert,
    updateMaintenanceAlert,
    deleteMaintenanceAlert,
    loading,
    error,
    success,
  };
};