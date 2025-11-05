import { useState, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, ScrollShadow } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faRefresh, faTimes } from "@fortawesome/free-solid-svg-icons";
import { PanelItem } from "./PanelItem";
import { useGetSidePanelData } from "../hooks/useGetSidePanelData";

/**
 * Responsive side panel component
 * Desktop: Always visible on the side
 * Mobile: Toggleable drawer
 * @param {Object} props
 * @param {string} props.role - User role: 'admin', 'manager', or 'driver'
 * @param {Function} props.onItemClick - Optional callback when item is clicked
 */
export const SidePanel = memo(function SidePanel({
  onItemClick,
  mainMenuItems,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState("dashboard");
  const navigate = useNavigate();

  // Fetch paginated data
  const {
    results,
    count,
    next,
    previous,
    loading,
    error,
    refetch,
    fetchNext,
    fetchPrevious,
  } = useGetSidePanelData(currentSection?.apiEndpoint || null);

  const handleMainClick = (item) => {
    setSelectedItemId(item.key);
    setCurrentSection(item.apiEndpoint ? item : null);
    if (!item.apiEndpoint) {
      if (onItemClick) onItemClick(item);
      navigate(item.key);
      if (window.innerWidth < 768) setIsOpen(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItemId(item.id);
    if (onItemClick) onItemClick(item);
    if (window.innerWidth < 768) setIsOpen(false);
    navigate(`${currentSection.key}/${item.id}`, { state: { item } });
  };

  const handleLoadMore = () => {
    if (next) fetchNext();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleBackToMenu = () => {
    setCurrentSection(null);
  };

  const renderContent = () => {
    if (!currentSection) {
      // Main menu
      return (
        <ScrollShadow className="h-full">
          <div className="p-4">
            {mainMenuItems.map((item) => (
              <div key={item.key} className="mb-2">
                <Button
                  variant={selectedItemId === item.key ? "solid" : "flat"}
                  color={selectedItemId === item.key ? "primary" : "default"}
                  onPress={() => handleMainClick(item)}
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              </div>
            ))}
          </div>
        </ScrollShadow>
      );
    }

    // Sub section content with API data
    const displayData = currentSection.apiEndpoint ? results : [];

    if (loading && displayData.length === 0) {
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

    if (displayData.length === 0 && !loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-foreground/60">No items found</p>
        </div>
      );
    }

    return (
      <ScrollShadow className="h-full">
        <div className="p-4">
          {displayData.map((item) => (
            <div key={item.id}>
              <PanelItem
                item={item}
                onClick={() => handleItemClick(item)}
                isSelected={selectedItemId === item.id}
              />
            </div>
          ))}

          {/* Load More Button */}
          {currentSection.apiEndpoint && next && (
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

  const panelContent = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider">
        <h2 className="text-lg font-semibold text-foreground">
          {currentSection ? currentSection.label : "Menu"}
        </h2>
        {currentSection && currentSection.apiEndpoint && (
          <p className="text-xs text-foreground/60 mt-1">
            {results.length} {results.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>
      {currentSection && (
        <>
          <Button
            variant="light"
            onPress={handleBackToMenu}
            size="sm"
            aria-label="Back to menu"
            className="mx-4 my-2"
          >
            Back to Menu
          </Button>
          {currentSection.apiEndpoint && (
            <Button
              onPress={handleRefresh}
              size="sm"
              aria-label="Refresh data"
              isLoading={loading && results.length === 0}
              className="mx-6 px-2 space-x-1.5 w-fit bg-blue-500 text-md text-white hover:bg-blue-700 mb-2"
            >
              <FontAwesomeIcon icon={faRefresh} className="" />
              <p>Refresh</p>
            </Button>
          )}
          <hr className="mx-2 text-white mt-2" />
        </>
      )}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button
        isIconOnly
        variant="flat"
        onPress={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50"
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </Button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Side Panel */}
      <aside
        className={`lg:hidden w-80 h-screen border-r border-divider bg-content1 fixed left-0 top-0 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {panelContent}
      </aside>

      {/* Desktop Side Panel */}
      <aside className="hidden lg:block w-80 h-screen border-r border-divider bg-content1 fixed left-0 top-0 z-30">
        {panelContent}
      </aside>
    </>
  );
});
