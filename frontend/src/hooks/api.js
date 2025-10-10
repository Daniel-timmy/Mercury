import axios from "axios";

const apiURL = ""; //Production url

console.log("API URL from env:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiURL,
});

export const getEntries = async (logsheetId) => {
  try {
    const response = await api.get(`/logentries/?log_id=${logsheetId}`);
    if (response.status === 200) {
      return response.data;
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
