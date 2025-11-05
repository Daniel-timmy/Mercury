import axios from "axios";
import Cookies from "js-cookie";

const apiURL = ""; //Production url

console.log("API URL from env:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiURL,
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getEntries = async (logsheetId) => {
  try {
    const response = await api.get(`/logentries/?logsheet=${logsheetId}`);
    if (response.status === 200) {
      return response.data.results;
    } else {
      console.error(`Failed to fetch entries. Status code: ${response.status}`);
      return [];
    }
  } catch (error) {
    let errorMessage = "An error occurred while getting the log entry.";

    if (error.response) {
      errorMessage = ` ${
        error.response.data?.error[0] + " - " + error.response.data?.msg[0] ||
        "Unknown error"
      }`;
    } else if (error.request) {
      errorMessage = "Network error: Could not reach the server.";
    } else {
      errorMessage = `Request error: ${error.message}`;
    }

    console.error("Log entry submission error:", error, errorMessage);
    return [];
  }
};

export default api;
