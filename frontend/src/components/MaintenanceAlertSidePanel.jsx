import {
  Button,
  Spinner,
  ScrollShadow,
  Card,
  CardBody,
  Chip,
  Tooltip,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faRefresh, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useGetSidePanelData } from "../hooks/useGetSidePanelData";

/**
 * Side panel component to display maintenance alerts for a vehicle
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Function to close the panel
 * @param {string} props.vehicleId - The vehicle ID to fetch maintenance alerts for
 * @param {Function} props.onEdit - Function to handle editing an alert
 */
export function MaintenanceAlertSidePanel({
  isOpen,
  onClose,
  vehicleId,
  onEdit,
  url = null,
}) {
  const endpoint = vehicleId ? `maintenance-alerts/?vehicle=${vehicleId}` : url;

  const { results, count, next, loading, error, refetch, fetchNext } =
    useGetSidePanelData(endpoint);

  const handleLoadMore = () => {
    if (next) fetchNext();
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (isResolved) => {
    return isResolved ? "success" : "warning";
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
          <p className="text-danger text-sm mb-2">
            Error loading maintenance alerts
          </p>
          <p className="text-xs text-foreground/60">{error}</p>
        </div>
      );
    }

    if (results.length === 0 && !loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-foreground/60">
            No maintenance alerts found
          </p>
        </div>
      );
    }

    return (
      <ScrollShadow className="h-full">
        <div className="p-4 space-y-3">
          {results.map((alert) => (
            <Card
              key={alert.id}
              shadow="sm"
              className="hover:shadow-md transition-shadow"
            >
              <CardBody className="p-4">
                <div className="space-y-2">
                  {/* Header with Alert Type and Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">
                        {alert.alert_type}
                      </h4>
                      <p className="text-xs text-foreground/60 mt-1">
                        Created: {formatDate(alert.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip
                        color={getStatusColor(alert.is_resolved)}
                        size="sm"
                        variant="flat"
                      >
                        {alert.is_resolved ? "Resolved" : "Pending"}
                      </Chip>
                      {onEdit && (
                        <Tooltip content="Edit alert">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onEdit(alert)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Resolved Date */}
                  {alert.is_resolved && alert.resolved_at && (
                    <div className="text-xs">
                      <span className="text-foreground/60">Resolved: </span>
                      <span className="font-semibold">
                        {formatDate(alert.resolved_at)}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {alert.notes && (
                    <div className="pt-2 border-t border-divider">
                      <p className="text-xs text-foreground/60">Notes:</p>
                      <p className="text-xs mt-1">{alert.notes}</p>
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
                Maintenance Alerts
              </h2>
              <p className="text-xs text-foreground/60 mt-1">
                {count} {count === 1 ? "alert" : "alerts"} total
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
