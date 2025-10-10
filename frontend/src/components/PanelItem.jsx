import { Card, CardBody, Button } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

/**
 * Individual panel item component
 * @param {Object} props
 * @param {Object} props.item - The data item to display
 * @param {Function} props.onClick - Optional click handler
 * @param {Function} props.onDelete - Optional delete handler
 * @param {boolean} props.isSelected - Whether this item is selected
 */
export function PanelItem({ item, onClick, onDelete, isSelected = false }) {
  const handleDelete = (e) => {
    // e.stopPropagation(); // Prevent card click when deleting
    if (onDelete) {
      onDelete(item);
    }
  };

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className={`mb-2 hover:shadow-md transition-all w-full ${
        isSelected ? "bg-blue-500/20 border-2 border-blue-500" : ""
      }`}
      shadow="sm"
    >
      <CardBody className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col gap-2 flex-1">
            {item.driver && (
              <h3 className="text-sm font-semibold text-foreground">
                Driver's Name: {item.driver}
              </h3>
            )}
            {item.current_location && (
              <p className="text-xs text-foreground/60">
                Current location: {item.current_location}
              </p>
            )}
            {item.id && (
              <span className="text-xs text-foreground/40">ID: {item.id}</span>
            )}
          </div>
          {onDelete && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={handleDelete}
              className="min-w-unit-8 w-8 h-8"
              aria-label="Delete logsheet"
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
