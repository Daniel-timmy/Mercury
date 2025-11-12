import { useState, useEffect } from "react";
import {
  Button,
  Spinner,
  ScrollShadow,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { useGetSidePanelData } from "../hooks/useGetSidePanelData";

/**
 * Side panel component to display fuel logs for a vehicle
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Function to close the panel
 * @param {string} props.vehicleId - The vehicle ID to fetch fuel logs for
 */
export function FuelLogSidePanel({ isOpen, onClose, vehicleId }) {
  const endpoint = vehicleId ? `fuel-logs/?vehicle=${vehicleId}` : null;

  const { results, count, next, loading, error, refetch, fetchNext } =
    useGetSidePanelData(endpoint);

  const handleLoadMore = () => {
    if (next) fetchNext();
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderContent = () => {
    if (loading && results.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-danger text-sm mb-2">Error loading fuel logs</p>
          <p className="text-xs text-foreground/60">{error}</p>
        </div>
      );
    }

    if (results.length === 0 && !loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-foreground/60">No fuel logs found</p>
        </div>
      );
    }

    return (
      <ScrollShadow className="h-full">
        <div className="p-4 space-y-3">
          {results.map((log) => (
            <Card
              key={log.id}
              shadow="sm"
              className="hover:shadow-md transition-shadow"
            >
              <CardBody className="p-4">
                <div className="space-y-2">
                  {/* Date and Fuel Type */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-foreground/60">
                        {formatDate(log.logged_at)}
                      </p>
                    </div>
                  </div>

                  {/* Fuel Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {log.liters && (
                      <div>
                        <span className="text-foreground/60">Liters:</span>
                        <p className="font-semibold">{log.liters} L</p>
                      </div>
                    )}
                    {log.cost && (
                      <div>
                        <span className="text-foreground/60">Cost:</span>
                        <p className="font-semibold">${log.cost}</p>
                      </div>
                    )}
                    {log.odometer_reading_km && (
                      <div>
                        <span className="text-foreground/60">Odometer:</span>
                        <p className="font-semibold">
                          {log.odometer_reading_km.toLocaleString()} km
                        </p>
                      </div>
                    )}
                    {log.fuel_station_name && (
                      <div className="col-span-2">
                        <span className="text-foreground/60">Station:</span>
                        <p className="font-semibold">{log.fuel_station_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {log.receipt_photo_url && (
                    <div className="pt-2 border-t border-divider">
                      <img src={log.receipt_photo_url} />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Load More Button */}
          {next && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="flat"
                color="primary"
                onPress={handleLoadMore}
                isLoading={loading}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </ScrollShadow>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <aside
        className={`w-96 h-screen border-l border-divider bg-content1 fixed right-0 top-0 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-divider flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Fuel Logs
              </h2>
              <p className="text-xs text-foreground/60 mt-1">
                {count} {count === 1 ? "log" : "logs"} total
              </p>
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              size="sm"
              aria-label="Close panel"
            >
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>

          {/* Refresh Button */}
          <div className="px-4 py-2">
            <Button
              onPress={handleRefresh}
              size="sm"
              aria-label="Refresh data"
              isLoading={loading && results.length === 0}
              className="w-full bg-blue-500 text-white hover:bg-blue-700"
              startContent={<FontAwesomeIcon icon={faRefresh} />}
            >
              Refresh
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </div>
      </aside>
    </>
  );
}
