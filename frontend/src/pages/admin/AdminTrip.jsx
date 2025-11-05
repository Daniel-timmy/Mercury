import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, Spinner, Card, CardBody, Chip } from "@heroui/react";
import { useGetSidePanelData } from "../../hooks/useGetSidePanelData";
import { LogsheetCard } from "../../components/LogsheetCard";
import MapCard from "../../components/Map";

import { getEntries } from "../../hooks/api";

const AdminTrip = () => {
  const location = useLocation();
  const { item } = location.state || {};
  const { id } = useParams();

  const [entries, setEntries] = useState([]);
  const [mainSheet, setMainSheet] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  const handleItemClick = (log) => {
    setSelectedLogId(log.id);
    setMainSheet(log);
    getEntries(log.id).then((entries) => {
      setEntries(entries);
    });
  };

  // Fetch paginated logsheets for this trip
  const {
    results: logsheets,
    next,
    loading,
    error,
    fetchNext,
    refetch,
  } = useGetSidePanelData(id ? `logsheets/?trip=${id}` : null);

  // Get status color based on status value
  const getStatusColor = (status) => {
    if (!status) return "default";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("complete") || statusLower.includes("active")) {
      return "success";
    }
    if (statusLower.includes("pending") || statusLower.includes("progress")) {
      return "warning";
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed")) {
      return "danger";
    }
    return "primary";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="p-4 border-b border-divider bg-content1">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Driver Trip</h2>
            <Button
              color="primary"
              startContent={<FontAwesomeIcon icon={faPlus} />}
              onPress={() => setIsModalOpen(true)}
              className="shadow-lg"
              size="md"
            >
              Create Trip
            </Button>
          </div>

          {item && (
            <Card shadow="sm">
              <CardBody className="p-5 bg-content2">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Trip Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
                      Trip ID
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {item.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
                      Trip Name
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {item.name || item.label || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
                      Trip Status
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {item.status}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Main Layout: Main Content + Side Panel */}
      <div className="max-w-[1600px] mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content Area - Left Side */}
          <div className="flex-1 order-2 lg:order-1">
            {mainSheet ? (
              <LogsheetCard
                trip={item}
                logsheet={mainSheet}
                entries={entries}
                onNewEntry={() => setIsEntryModalOpen(true)}
                onUpdateLogsheet={(updatedData) =>
                  console.log("Logsheet updated with data:", updatedData)
                }
              />
            ) : (
              <Card shadow="sm" className="h-full min-h-[400px]">
                <CardBody className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <p className="text-lg text-foreground/60 mb-2">
                      No logsheet selected
                    </p>
                    <p className="text-sm text-foreground/40">
                      Select a logsheet from the side panel to view details
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Side Panel - Right Side */}
          <div className="w-full lg:w-80 xl:w-96 order-1 lg:order-2">
            <Card shadow="md" className="lg:sticky lg:top-4">
              <CardBody className="p-0">
                {/* Panel Header */}
                <div className="p-4 border-b border-divider bg-content2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Logsheets
                    </h3>
                    <Button
                      variant="light"
                      onPress={refetch}
                      size="sm"
                      disabled={loading}
                      className="min-w-unit-16"
                    >
                      Refresh
                    </Button>
                  </div>
                  {logsheets.length > 0 && (
                    <p className="text-xs text-foreground/60">
                      {logsheets.length} logsheet
                      {logsheets.length !== 1 ? "s" : ""} found
                    </p>
                  )}
                </div>

                {/* Panel Content - Scrollable */}
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {loading && logsheets.length === 0 && (
                    <div className="flex justify-center items-center py-12">
                      <Spinner size="lg" color="primary" />
                    </div>
                  )}

                  {error && (
                    <div className="p-4">
                      <div className="p-4 bg-danger/10 rounded-lg">
                        <p className="text-danger text-sm">Error: {error}</p>
                      </div>
                    </div>
                  )}

                  {logsheets.length === 0 && !loading && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-foreground/60">
                        No logsheets found.
                      </p>
                    </div>
                  )}

                  {/* Logsheet List */}
                  <div className="p-2">
                    {logsheets.map((log) => (
                      <Card
                        key={log.id}
                        isPressable
                        onPress={() => handleItemClick(log)}
                        className={`mb-2 transition-all ${
                          selectedLogId === log.id
                            ? "border-2 border-primary bg-primary/5"
                            : "border border-divider/50 hover:border-primary/50"
                        }`}
                        shadow="sm"
                      >
                        <CardBody className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                Logsheet #{log.id}
                              </span>
                              <Chip
                                color={getStatusColor(log.status)}
                                size="sm"
                                variant="flat"
                                className="h-5"
                              >
                                {log.status || "N/A"}
                              </Chip>
                            </div>
                            <div>
                              <span className="text-xs text-foreground/60">
                                {log.date || "N/A"}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {next && (
                    <div className="p-4 border-t border-divider">
                      <Button
                        variant="flat"
                        color="primary"
                        onPress={fetchNext}
                        isLoading={loading}
                        disabled={loading}
                        fullWidth
                      >
                        {loading ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
      <MapCard logsheet={mainSheet} trip={item} entries={entries} />
    </div>
  );
};

export default AdminTrip;
