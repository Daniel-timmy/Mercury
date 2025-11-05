import { useState } from "react";
import api from "../hooks/api";
import { addToast } from "@heroui/react";

/**
 * Custom hook to create a new user via the API.
 * @returns {Object} - An object containing the createUser function, loading state, error state, and success state.
 */
export const useCreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createUser = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post(`users/${userData.role}s/`, userData);
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

  return { createUser, loading, error, success };
};
