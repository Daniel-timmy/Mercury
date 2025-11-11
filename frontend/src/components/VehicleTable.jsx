import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Spinner,
  Chip,
  Tooltip,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { addToast } from "@heroui/react";

/**
 * Table component for displaying vehicles with CRUD actions
 */
export function VehicleTable({
  vehicles = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onCreate,
  drivers = [],
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      setDeletingId(vehicleId);
      try {
        await onDelete(vehicleId);
        addToast({
          title: "Success",
          description: "Vehicle deleted successfully",
          severity: "success",
        });
      } catch (err) {
        addToast({
          title: "Error",
          description: "Failed to delete vehicle",
          severity: "danger",
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? driver.name : "Unassigned";
  };

  const getFuelTypeColor = (fuelType) => {
    switch (fuelType) {
      case "Electric":
        return "success";
      case "Diesel":
        return "warning";
      case "Petrol":
        return "primary";
      default:
        return "default";
    }
  };

  const getOwnershipColor = (status) => {
    switch (status) {
      case "Owned":
        return "success";
      case "Leased":
        return "warning";
      case "Contract":
        return "primary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <p>Error loading vehicles: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vehicles</h3>
        <Button
          color="primary"
          startContent={<FontAwesomeIcon icon={faPlus} />}
          onPress={onCreate}
        >
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center p-8 text-foreground/60">
          <p>No vehicles found. Click "Add Vehicle" to create one.</p>
        </div>
      ) : (
        <Table aria-label="Vehicles table">
          <TableHeader>
            <TableColumn>LICENSE PLATE</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>DRIVER</TableColumn>
            <TableColumn>FUEL TYPE</TableColumn>
            <TableColumn>OWNERSHIP</TableColumn>
            <TableColumn>MILEAGE (KM)</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <span className="font-semibold">{vehicle.license_plate}</span>
                </TableCell>
                <TableCell>{vehicle.vehicle_type}</TableCell>
                <TableCell>{getDriverName(vehicle.driver)}</TableCell>
                <TableCell>
                  <Chip color={getFuelTypeColor(vehicle.fuel_type)} size="sm">
                    {vehicle.fuel_type}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    color={getOwnershipColor(vehicle.ownership_status)}
                    size="sm"
                  >
                    {vehicle.ownership_status}
                  </Chip>
                </TableCell>
                <TableCell>
                  {vehicle.current_mileage_km.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Edit vehicle">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => onEdit(vehicle)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete vehicle" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(vehicle.id)}
                        isLoading={deletingId === vehicle.id}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
