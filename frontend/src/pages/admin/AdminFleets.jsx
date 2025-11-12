import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { usePersonnelData } from "../../hooks/usePersonnelData";
import { useFleetData } from "../../hooks/useFleetData";
import { useVehicleData } from "../../hooks/useVehicleData";
import { useCreateFleet } from "../../hooks/useCreateFleet";
import { useVehicleOperations } from "../../hooks/useVehicleOperations";
import { CreateFleetModal } from "../../components/CreateFleetModal";
import { CreateVehicleModal } from "../../components/CreateVehicleModal";
import { VehicleTable } from "../../components/VehicleTable";
import { addToast } from "@heroui/react";

const AdminFleets = () => {
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Fetch managers data (cached)
  const {
    results: managerResults,
    loading: managerLoading,
    error: managerError,
  } = usePersonnelData("users/managers/");

  // Fetch drivers data (cached)
  const {
    results: driverResults,
    loading: driverLoading,
    error: driverError,
  } = usePersonnelData("users/drivers/");

  // Fetch fleets data
  const {
    results: fleetResults,
    loading: fleetLoading,
    error: fleetError,
    refetch: refetchFleets,
  } = useFleetData();

  // Fetch vehicles for selected fleet
  //   console.log("Selected Fleet ID:", selectedFleet);
  //   useEffect(() => {
  //     if (fleetResults.length > 0 && !selectedFleet) {
  //       setSelectedFleet(fleetResults[0].id);
  //     }
  //     refetchVehicles();
  //   }, [fleetResults, selectedFleet]);
  const {
    results: vehicleResults,
    loading: vehicleLoading,
    error: vehicleError,
    refetch: refetchVehicles,
  } = useVehicleData(`vehicles/?fleet=${selectedFleet}`);

  // Fleet creation hook
  const {
    createFleet,
    loading: createFleetLoading,
    error: createFleetError,
    success: createFleetSuccess,
  } = useCreateFleet();

  // Vehicle operations hook
  const {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    loading: vehicleOpLoading,
    error: vehicleOpError,
    success: vehicleOpSuccess,
  } = useVehicleOperations();

  // Auto-select first fleet on load

  const handleCreateFleet = async (fleetData) => {
    const result = await createFleet(fleetData);
    if (result) {
      refetchFleets();
    }
  };

  const handleCreateVehicle = async (vehicleData) => {
    const result = await createVehicle(vehicleData);
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

  const getManagerName = (managerId) => {
    const manager = managerResults.find((m) => m.id === managerId);
    return manager ? manager.name : "Unknown";
  };
  const getDriversByManagerId = (fleetId) => {
    if (fleetId) {
      const fleet = fleetResults.find((f) => f.id === fleetId);

      const drivers = driverResults.filter((d) => d.manager === fleet.manager);
      return drivers;
    }
    return [];
  };
  const getFleetName = (fleetId) => {
    const fleet = fleetResults.find((f) => f.id === fleetId);
    return fleet ? fleet.name : "Unknown";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fleet Management</h1>
        <Button color="primary" onPress={() => setIsFleetModalOpen(true)}>
          Create Fleet
        </Button>
      </div>

      <div className="space-y-6">
        {/* Fleet Selection */}
        <Card>
          <CardBody>
            <p>{`Selected Fleet ${
              selectedFleet ? `(Name: ${getFleetName(selectedFleet)})` : ""
            }`}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  label="Select Fleet "
                  placeholder="Choose a fleet to manage"
                  selectedKeys={selectedFleet ? [selectedFleet.toString()] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];
                    setSelectedFleet(value);
                  }}
                  isLoading={fleetLoading}
                  isDisabled={fleetLoading || fleetResults.length === 0}
                >
                  {fleetResults.map((fleet) => (
                    <SelectItem
                      key={fleet.id.toString()}
                      value={fleet.id.toString()}
                    >
                      {fleet.name} - Manager: {getManagerName(fleet.manager)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {fleetError && (
              <div className="mt-4 text-danger">
                <p>Error loading fleets: {fleetError}</p>
              </div>
            )}

            {!fleetLoading && fleetResults.length === 0 && (
              <div className="mt-4 text-center text-foreground/60">
                <p>No fleets found. Create a fleet to get started.</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Divider />

        {/* Vehicles Section */}
        {selectedFleet && (
          <Card>
            <CardBody>
              <VehicleTable
                vehicles={vehicleResults}
                loading={vehicleLoading}
                error={vehicleError}
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
                onCreate={handleCreateNewVehicle}
                drivers={driverResults}
              />
            </CardBody>
          </Card>
        )}
      </div>

      {/* Create Fleet Modal */}
      <CreateFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        onSubmit={handleCreateFleet}
        loading={createFleetLoading}
        error={createFleetError}
        success={createFleetSuccess}
        managers={managerResults}
      />

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
        drivers={getDriversByManagerId(selectedFleet)}
        // drivers={driverResults}
        fleetId={selectedFleet}
        editMode={!!editingVehicle}
        vehicleData={editingVehicle}
      />
    </div>
  );
};

export default AdminFleets;
