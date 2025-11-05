import { useState } from "react";
import { HeroUIProvider, Button, ToastProvider } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { SidePanel } from "../../components/SidePanel";
// import { LogsheetModal } from "./components/LogsheetModal";
// import { LogsheetCard } from "./components/LogsheetCard";
// import { LogEntryModal } from "./components/LogEntryModal";
import api, { getEntries } from "../../hooks/api";
// import MapCard from "./components/Map";

const DriverDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [mainSheet, setMainSheet] = useState(null);
  const [entries, setEntries] = useState([]);

  const handleItemClick = (item) => {
    setMainSheet(item);
    getEntries(item.id).then((entries) => {
      setEntries(entries);
    });
  };

  /**
   * Handles the submission of logsheet data to the API
   * @param {Object} logsheetData - The data to be submitted to the API
   * @param {Function} [onSuccess] - Optional callback for successful submission
   * @param {Function} [onError] - Optional callback for handling errors
   */
  const handleLogsheetSubmit = async (
    logsheetData,
    { onSuccess, onError } = {}
  ) => {
    try {
      // Send POST request to the API
      const response = await api.post("logsheets/", logsheetData);

      // Check if the response is successful
      if (response.status === 201) {
        if (onSuccess) {
          onSuccess(response.data); // Call success callback if provided
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      // Handle different types of errors
      let errorMessage = "An error occurred while submitting the logsheet.";

      if (error.response) {
        errorMessage = ` ${
          error.response.data?.error + " - " + error.response.data?.msg ||
          "Unknown error"
        }`;
      } else if (error.request) {
        // Request was made but no response received (e.g., network error)
        errorMessage = "Network error: Could not reach the server.";
      } else {
        // Error setting up the request
        errorMessage = `Request error: ${error.message}`;
      }

      console.error("Submission error:", errorMessage);
      if (onError) onError(errorMessage); // Call error callback if provided
    }
  };

  /**
   * Handles the submission of log entry data to the API
   * @param {Object} entryData - The log entry data to be submitted
   */
  const handleLogEntrySubmit = async (entryData) => {
    try {
      const response = await api.post("logentries/", entryData);

      if (response.status === 201) {
        // Refresh entries for the current logsheet
        if (mainSheet) {
          const updatedEntries = await getEntries(mainSheet.id);
          setEntries(updatedEntries);
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      let errorMessage = "An error occurred while submitting the log entry.";

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
      throw new Error(errorMessage);
    }
  };
  return (
    <div>
      {/* <ToastProvider placement="top-right" /> */}
      <div className="min-h-screen bg-background">
        {/* Create Logsheet Button - Top Left */}
        <div className="fixed top-0 left-0 w-full shadow-xl h-17 flex items-center p-4 bg-background z-30 ">
          <Button
            color="primary"
            startContent={<FontAwesomeIcon icon={faPlus} />}
            onPress={() => setIsModalOpen(true)}
            className="fixed top-4 right-2 md:right-[2rem] z-50 shadow-lg"
            size="md"
          >
            Create Logsheet
          </Button>

          <SidePanel
            apiEndpoint="logsheets/"
            setEntries={setEntries}
            setMainSheet={setMainSheet}
            onItemClick={handleItemClick}
          />
        </div>

        {/* Logsheet Modal */}
        {/* <LogsheetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleLogsheetSubmit}
        /> */}

        {/* Log Entry Modal */}
        {/* <LogEntryModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          onSubmit={handleLogEntrySubmit}
          logId={mainSheet?.id}
        /> */}

        {/* Main Content Area */}
        <main className="lg:ml-80 pt-20 min-h-screen p-6">
          {/* <LogsheetCard
            logsheet={mainSheet}
            entries={entries}
            onNewEntry={() => setIsEntryModalOpen(true)}
            onUpdateLogsheet={(updatedData) =>
              console.log("Logsheet updated with data:", updatedData)
            }
          /> */}
        </main>
      </div>
      {/* <MapCard logsheet={mainSheet} entries={entries} /> */}
    </div>
  );
};

export default DriverDashboard;
