import { useState, useEffect } from "react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import Cookies from "js-cookie";
import { usePersonnelData } from "../../hooks/usePersonnelData";
import { useVehicleData } from "../../hooks/useVehicleData";
import { useVehicleDataByManager } from "../../hooks/useVehicleDataByManager";
import { useVehicleOperations } from "../../hooks/useVehicleOperations";
import { CreateVehicleModal } from "../../components/CreateVehicleModal";
import { VehicleTable } from "../../components/VehicleTable";
import { FuelLogSidePanel } from "../../components/FuelLogSidePanel";
import { addToast } from "@heroui/react";
import api from "../../hooks/api";

const ManagerTrucks = () => {
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [managerId, setManagerId] = useState(null);
  const [fleet, setFleet] = useState(null);
  const [isFuelLogPanelOpen, setIsFuelLogPanelOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Fetch manager's fleet
  useEffect(() => {
    const fetchFleet = async () => {
      if (!managerId) return;
      try {
        const response = await api.get(`fleets/?manager=${managerId}`);
        setFleet(
          response.data.results.length > 0 ? response.data.results[0] : null
        );
      } catch (error) {
        setFleet(null);
        addToast({
          title: "Error",
          description: "Failed to fetch fleet data.",
          severity: "danger",
        });
      }
    };
    fetchFleet();
  }, [managerId]);

  // Get manager ID from cookie
  useEffect(() => {
    const managerIdFromCookie = Cookies.get("manager_id");
    if (managerIdFromCookie) {
      setManagerId(managerIdFromCookie);
    } else {
      addToast({
        title: "Error",
        description: "Manager ID not found. Please log in again.",
        severity: "danger",
      });
    }
  }, []);

  // Fetch drivers data specific to this manager (cached)
  const {
    results: driverResults,
    loading: driverLoading,
    error: driverError,
  } = usePersonnelData("users/drivers/");

  // Fetch vehicles for this manager
  const {
    results: vehicleResults,
    loading: vehicleLoading,

    error: vehicleError,
    refetch: refetchVehicles,
  } = useVehicleData("vehicles/");

  // Vehicle operations hook
  const {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    loading: vehicleOpLoading,
    error: vehicleOpError,
    success: vehicleOpSuccess,
  } = useVehicleOperations();

  const handleCreateVehicle = async (vehicleData) => {
    const vehicleWithManager = {
      ...vehicleData,
    };

    const result = await createVehicle(vehicleWithManager);
    if (result) {
      refetchVehicles();
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
    }
  };

  const handleUpdateVehicle = async (vehicleData) => {
    if (editingVehicle) {
      const result = await updateVehicle(editingVehicle.id, vehicleData);
      if (result) {
        refetchVehicles();
        setIsVehicleModalOpen(false);
        setEditingVehicle(null);
      }
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const result = await deleteVehicle(vehicleId);
    if (result) {
      refetchVehicles();
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleCreateNewVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleViewFuelLogs = (vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setIsFuelLogPanelOpen(true);
  };

  if (!managerId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Fleet Vehicles</h1>
      </div>

      <div className="space-y-6">
        {/* Vehicles Section */}
        <Card>
          <CardBody>
            <VehicleTable
              vehicles={vehicleResults}
              loading={vehicleLoading}
              error={vehicleError}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
              onCreate={handleCreateNewVehicle}
              onViewFuelLogs={handleViewFuelLogs}
              drivers={driverResults}
            />
          </CardBody>
        </Card>
      </div>

      {/* Create/Edit Vehicle Modal */}
      <CreateVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
        loading={vehicleOpLoading}
        error={vehicleOpError}
        success={vehicleOpSuccess}
        drivers={driverResults}
        fleetId={fleet ? fleet.id : null}
        editMode={!!editingVehicle}
        vehicleData={editingVehicle}
      />

      {/* Fuel Log Side Panel */}
      <FuelLogSidePanel
        isOpen={isFuelLogPanelOpen}
        onClose={() => setIsFuelLogPanelOpen(false)}
        vehicleId={selectedVehicleId}
      />
    </div>
  );
};

export default ManagerTrucks;
