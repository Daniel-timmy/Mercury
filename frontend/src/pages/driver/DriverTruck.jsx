import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Divider,
} from "@heroui/react";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGasPump } from "@fortawesome/free-solid-svg-icons";
import { useVehicleData } from "../../hooks/useVehicleData";
import { useFuelLog } from "../../hooks/useFuelLog";
import { FuelLogModal } from "../../components/FuelLogModal";
import { addToast } from "@heroui/react";

const DriverTruck = () => {
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  // Get driver ID from cookie
  useEffect(() => {
    const driverIdFromCookie = Cookies.get("driver_id");
    if (driverIdFromCookie) {
      setDriverId(driverIdFromCookie);
    } else {
      addToast({
        title: "Error",
        description: "Driver ID not found. Please log in again.",
        severity: "danger",
      });
    }
  }, []);

  // Fetch vehicle data for this driver
  const {
    results: vehicleResults,
    loading: vehicleLoading,
    error: vehicleError,
    refetch: refetchVehicle,
  } = useVehicleData("vehicles/");
  console.log("Vehicle Results:", vehicleResults);

  // Set the vehicle when data is loaded
  useEffect(() => {
    if (vehicleResults && vehicleResults.length > 0) {
      setVehicle(vehicleResults[0]); // Assuming driver has one vehicle
    }
  }, [vehicleResults]);

  // Fuel log hook
  const {
    createFuelLog,
    loading: fuelLogLoading,
    error: fuelLogError,
    success: fuelLogSuccess,
  } = useFuelLog();

  const handleCreateFuelLog = async (fuelLogData) => {
    const result = await createFuelLog(fuelLogData);
    if (result) {
      setIsFuelModalOpen(false);
      refetchVehicle();
    }
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

  if (!driverId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Loading vehicle information..." />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardBody className="text-center p-8">
            <p className="text-danger text-lg">
              Error loading vehicle: {vehicleError}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardBody className="text-center p-8">
            <p className="text-foreground/60 text-lg">
              No vehicle assigned to you yet.
            </p>
            <p className="text-sm text-foreground/40 mt-2">
              Please contact your manager to get a vehicle assigned.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Vehicle</h1>
        <Button
          color="primary"
          startContent={<FontAwesomeIcon icon={faGasPump} />}
          onPress={() => setIsFuelModalOpen(true)}
          size="lg"
        >
          Enter Fuel Log
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-content2 p-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-2xl font-bold">{vehicle.license_plate}</h2>
              <p className="text-foreground/60">{vehicle.vehicle_type}</p>
            </div>
            <div className="flex gap-2">
              <Chip color={getFuelTypeColor(vehicle.fuel_type)} size="lg">
                {vehicle.fuel_type}
              </Chip>
              <Chip
                color={getOwnershipColor(vehicle.ownership_status)}
                size="lg"
              >
                {vehicle.ownership_status}
              </Chip>
            </div>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Specifications</h3>

              {vehicle.capacity_kg && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Capacity (kg):</span>
                  <span className="font-semibold">
                    {vehicle.capacity_kg.toLocaleString()} kg
                  </span>
                </div>
              )}

              {vehicle.capacity_cubic_meters && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Capacity (m³):</span>
                  <span className="font-semibold">
                    {vehicle.capacity_cubic_meters} m³
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Current Mileage:</span>
                <span className="font-semibold">
                  {vehicle.current_mileage_km.toLocaleString()} km
                </span>
              </div>
            </div>

            {/* Maintenance Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Maintenance</h3>

              {vehicle.last_maintenance_date && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Last Maintenance:</span>
                  <span className="font-semibold">
                    {new Date(
                      vehicle.last_maintenance_date
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}

              {vehicle.next_maintenance_due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Next Maintenance:</span>
                  <span className="font-semibold">
                    {new Date(
                      vehicle.next_maintenance_due_date
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}

              {!vehicle.last_maintenance_date &&
                !vehicle.next_maintenance_due_date && (
                  <p className="text-foreground/40 text-sm">
                    No maintenance information available
                  </p>
                )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fuel Log Modal */}
      <FuelLogModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        onSubmit={handleCreateFuelLog}
        loading={fuelLogLoading}
        error={fuelLogError}
        success={fuelLogSuccess}
        vehicleId={vehicle?.id}
        driverId={driverId}
      />
    </div>
  );
};

export default DriverTruck;
