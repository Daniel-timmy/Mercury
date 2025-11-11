import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  DateInput,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { parseDate } from "@internationalized/date";

const FUEL_TYPE_CHOICES = [
  { key: "Diesel", label: "Diesel" },
  { key: "Petrol", label: "Petrol" },
  { key: "Electric", label: "Electric" },
];

const OWNERSHIP_STATUS_CHOICES = [
  { key: "Owned", label: "Owned" },
  { key: "Leased", label: "Leased" },
  { key: "Contract", label: "Contract" },
];

/**
 * Modal component for creating/editing vehicles
 */
export function CreateVehicleModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  drivers = [],
  fleetId = null,
  editMode = false,
  vehicleData = null,
}) {
  const [formData, setFormData] = useState({
    license_plate: "",
    vehicle_type: "",
    capacity_kg: "",
    capacity_cubic_meters: "",
    fuel_type: "Diesel",
    ownership_status: "Owned",
    current_mileage_km: "0",
    last_maintenance_date: null,
    next_maintenance_due_date: null,
    driver: null,
    fleet: fleetId,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        license_plate: "",
        vehicle_type: "",
        capacity_kg: "",
        capacity_cubic_meters: "",
        fuel_type: "Diesel",
        ownership_status: "Owned",
        current_mileage_km: "0",
        last_maintenance_date: null,
        next_maintenance_due_date: null,
        driver: null,
        fleet: fleetId,
      });
      setErrors({});
    } else if (editMode && vehicleData) {
      setFormData({
        license_plate: vehicleData.license_plate || "",
        vehicle_type: vehicleData.vehicle_type || "",
        capacity_kg: vehicleData.capacity_kg?.toString() || "",
        capacity_cubic_meters:
          vehicleData.capacity_cubic_meters?.toString() || "",
        fuel_type: vehicleData.fuel_type || "Diesel",
        ownership_status: vehicleData.ownership_status || "Owned",
        current_mileage_km: vehicleData.current_mileage_km?.toString() || "0",
        last_maintenance_date: vehicleData.last_maintenance_date || null,
        next_maintenance_due_date:
          vehicleData.next_maintenance_due_date || null,
        driver: vehicleData.driver?.toString() || null,
        fleet: vehicleData.fleet || fleetId,
      });
    }
  }, [isOpen, editMode, vehicleData, fleetId]);

  useEffect(() => {
    if (success) {
      addToast({
        title: "Success",
        description: editMode
          ? "Vehicle updated successfully"
          : "Vehicle created successfully",
        severity: "success",
      });
      onClose();
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      error.map((errMsg) =>
        addToast({
          title: "Error",
          description: errMsg,
          severity: "danger",
        })
      );
    }
  }, [error]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = "License plate is required";
    } else if (formData.license_plate.length > 20) {
      newErrors.license_plate = "License plate must be 20 characters or less";
    }

    if (!formData.vehicle_type.trim()) {
      newErrors.vehicle_type = "Vehicle type is required";
    } else if (formData.vehicle_type.length > 50) {
      newErrors.vehicle_type = "Vehicle type must be 50 characters or less";
    }

    if (
      formData.capacity_cubic_meters &&
      parseFloat(formData.capacity_cubic_meters) < 0
    ) {
      newErrors.capacity_cubic_meters = "Capacity cannot be negative";
    }

    if (formData.capacity_kg && parseInt(formData.capacity_kg) < 0) {
      newErrors.capacity_kg = "Capacity cannot be negative";
    }

    if (parseInt(formData.current_mileage_km) < 0) {
      newErrors.current_mileage_km = "Mileage cannot be negative";
    }
    if (!fleetId) {
      newErrors.fleet = "Fleet is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        capacity_kg: formData.capacity_kg
          ? parseInt(formData.capacity_kg)
          : null,
        capacity_cubic_meters: formData.capacity_cubic_meters
          ? parseFloat(formData.capacity_cubic_meters)
          : null,
        current_mileage_km: parseInt(formData.current_mileage_km),
        driver: formData.driver || null,
      };
      onSubmit(submitData);
    }
  };

  const isFormValid =
    formData.license_plate.trim() &&
    formData.vehicle_type.trim() &&
    formData.license_plate.length <= 20 &&
    formData.vehicle_type.length <= 50;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">
            {editMode ? "Edit Vehicle" : "Create New Vehicle"}
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="License Plate"
                placeholder="e.g., ABC-123"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    license_plate: e.target.value,
                  }))
                }
                isRequired
                isInvalid={!!errors.license_plate}
                errorMessage={errors.license_plate}
              />

              <Input
                label="Vehicle Type"
                placeholder="e.g., Truck, Van"
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicle_type: e.target.value,
                  }))
                }
                isRequired
                isInvalid={!!errors.vehicle_type}
                errorMessage={errors.vehicle_type}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Capacity (kg)"
                type="number"
                placeholder="Optional"
                value={formData.capacity_kg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity_kg: e.target.value,
                  }))
                }
                isInvalid={!!errors.capacity_kg}
                errorMessage={errors.capacity_kg}
              />

              <Input
                label="Capacity (cubic meters)"
                type="number"
                step="0.01"
                placeholder="Optional"
                value={formData.capacity_cubic_meters}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity_cubic_meters: e.target.value,
                  }))
                }
                isInvalid={!!errors.capacity_cubic_meters}
                errorMessage={errors.capacity_cubic_meters}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Fuel Type"
                selectedKeys={[formData.fuel_type]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  setFormData((prev) => ({ ...prev, fuel_type: value }));
                }}
              >
                {FUEL_TYPE_CHOICES.map((fuel) => (
                  <SelectItem key={fuel.key} value={fuel.key}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Ownership Status"
                selectedKeys={[formData.ownership_status]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  setFormData((prev) => ({ ...prev, ownership_status: value }));
                }}
              >
                {OWNERSHIP_STATUS_CHOICES.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Input
              label="Current Mileage (km)"
              type="number"
              value={formData.current_mileage_km}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  current_mileage_km: e.target.value,
                }))
              }
              isInvalid={!!errors.current_mileage_km}
              errorMessage={errors.current_mileage_km}
            />

            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Last Maintenance Date"
                value={
                  formData.last_maintenance_date
                    ? parseDate(formData.last_maintenance_date)
                    : null
                }
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    last_maintenance_date: date ? date.toString() : null,
                  }))
                }
              />

              <DateInput
                label="Next Maintenance Due Date"
                value={
                  formData.next_maintenance_due_date
                    ? parseDate(formData.next_maintenance_due_date)
                    : null
                }
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    next_maintenance_due_date: date ? date.toString() : null,
                  }))
                }
              />
            </div>

            <Select
              label="Driver"
              placeholder="Select driver (optional)"
              selectedKeys={formData.driver ? [formData.driver.toString()] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setFormData((prev) => ({ ...prev, driver: value }));
              }}
            >
              {drivers.map((driver) => (
                <SelectItem
                  key={driver.id.toString()}
                  value={driver.id.toString()}
                >
                  {driver.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={!isFormValid || loading}
          >
            {loading
              ? editMode
                ? "Updating..."
                : "Creating..."
              : editMode
              ? "Update Vehicle"
              : "Create Vehicle"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
