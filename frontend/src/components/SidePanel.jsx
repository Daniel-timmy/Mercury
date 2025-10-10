import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Spinner,
  ScrollShadow,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { usePanelData } from "../hooks/usePanelData";
import { PanelItem } from "./PanelItem";
import api, { getEntries } from "../hooks/api";

/**
 * Groups logsheets by their creation date
 * @param {Array} data - Array of logsheet items
 * @returns {Object} - Object with dates as keys and arrays of items as values
 */
function groupByDate(data) {
  const groups = {};

  data.forEach((item) => {
    // Extract date from created_at or use a fallback
    let dateKey = "Unknown Date";

    if (item.created_at) {
      const date = new Date(item.created_at);
      dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  return groups;
}

/**
 * Responsive side panel component
 * Desktop: Always visible on the side
 * Mobile: Toggleable drawer
 * @param {Object} props
 * @param {string} props.apiEndpoint - API endpoint to fetch data from
 * @param {Function} props.setMainSheet - Callback to set the main sheet in parent
 * @param {Function} props.onItemClick - Optional callback when item is clicked
 */
export function SidePanel({
  apiEndpoint = "logsheets/",
  setEntries,
  setMainSheet,
  onItemClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, loading, error, refetch } = usePanelData(apiEndpoint);
  const [deleting, setDeleting] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    setMainSheet(data[0] || null);
    if (data[0]) {
      setSelectedItemId(data[0].id);
      getEntries(data[0].id).then((entries) => {
        setEntries(entries);
      });
    } else {
      setEntries([]);
    }
  }, [data]);

  const handleItemClick = (item) => {
    setSelectedItemId(item.id);
    if (onItemClick) {
      onItemClick(item);
    }
    // Close drawer on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleDelete = async (item) => {
    if (
      !confirm(
        `Are you sure you want to delete the logsheet for ${item.driver}?`
      )
    ) {
      return;
    }

    setDeleting(item.id);
    try {
      const response = await api.delete(`${apiEndpoint}${item.id}/`);

      if (response.status === 204 || response.status === 200) {
        refetch();
      } else {
        throw new Error(`Failed to delete: ${response.status}`);
      }
    } catch (err) {
      console.error("Error deleting logsheet:", err);
      alert("Failed to delete logsheet. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-danger text-sm mb-2">Error loading data</p>
          <p className="text-xs text-foreground/60">{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-foreground/60">No items found</p>
        </div>
      );
    }

    // Group data by date
    const groupedData = groupByDate(data);
    const dateKeys = Object.keys(groupedData);

    return (
      <ScrollShadow className="h-full">
        <div className="p-4">
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="mb-6">
              {/* Date Header */}
              <div className="mb-3 pb-2 border-b border-divider">
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                  {dateKey}
                </h3>
              </div>

              {/* Items for this date */}
              {groupedData[dateKey].map((item) => (
                <div
                  key={item.id}
                  className={deleting === item.id ? "opacity-50" : ""}
                >
                  <PanelItem
                    item={item}
                    onClick={() => handleItemClick(item)}
                    onDelete={handleDelete}
                    isSelected={selectedItemId === item.id}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollShadow>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        isIconOnly
        variant="flat"
        color="default"
        onPress={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40"
        aria-label="Open menu"
      >
        <FontAwesomeIcon icon={faBars} className="text-lg" />
      </Button>

      {/* Desktop Side Panel */}
      <aside className="hidden lg:block w-80 h-screen border-r border-divider bg-content1 fixed left-0 top-0">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-divider">
            <h2 className="text-lg font-semibold text-foreground">
              Daily Logsheets
            </h2>
            <p className="text-xs text-foreground/60 mt-1">
              {data.length} {data.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Button
            isIconOnly
            onPress={() => refetch()}
            size="sm"
            aria-label="Refresh data"
            className="mx-6 px-2 space-x-1.5 w-fit bg-blue-500 text-md text-white hover:bg-blue-700  mb-2"
          >
            <FontAwesomeIcon icon={faRefresh} className="" />
            <p>Refresh</p>
          </Button>
          <hr className="mx-2 text-white mt-10" />

          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="left"
        size="sm"
        className="lg:hidden"
      >
        <DrawerContent>
          <DrawerHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Daily Logsheets</h2>
              <p className="text-xs text-foreground/60 mt-1">
                {data.length} {data.length === 1 ? "item" : "items"}
              </p>
            </div>
          </DrawerHeader>
          <Button
            isIconOnly
            variant="light"
            onPress={() => refetch()}
            size="sm"
            aria-label="Refresh data"
            className="mx-6 px-2 space-x-1.5 w-fit bg-blue-500 text-md text-white hover:bg-blue-600 mb-2"
          >
            <FontAwesomeIcon icon={faRefresh} className="" />
            <p>Refresh</p>
          </Button>
          <hr className="mx-2 text-slate-400 mt-10" />
          <DrawerBody className="p-0">{renderContent()}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
