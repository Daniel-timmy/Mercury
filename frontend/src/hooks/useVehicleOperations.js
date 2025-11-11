import { useState } from "react";
import api from "./api";

/**
 * Custom hook for vehicle CRUD operations.
 * @returns {Object} - An object containing CRUD functions and their states.
 */
export const useVehicleOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createVehicle = async (vehicleData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post("vehicles/", vehicleData);
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

  const updateVehicle = async (vehicleId, vehicleData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put(`vehicles/${vehicleId}/`, vehicleData);
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

  const deleteVehicle = async (vehicleId) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.delete(`vehicles/${vehicleId}/`);
      setSuccess(true);
      return true;
    } catch (err) {
      const errorMessages = [];
      for (const key in err.response?.data) {
        errorMessages.push(`${key}: ${err.response.data[key]}`);
      }
      setError(errorMessages);
      setSuccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    loading,
    error,
    success,
  };
};