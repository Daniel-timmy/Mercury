import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { addToast } from "@heroui/react";

/**
 * Modal component for creating fuel logs
 */
export function FuelLogModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  vehicleId = null,
  driverId = null,
}) {
  const [formData, setFormData] = useState({
    vehicle: vehicleId,
    driver: driverId,
    liters: "",
    cost: "",
    odometer_reading_km: "",
    fuel_station_name: "",
    receipt_image: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        vehicle: vehicleId,
        driver: driverId,
        liters: "",
        cost: "",
        odometer_reading_km: "",
        fuel_station_name: "",
        receipt_image: null,
      });
      setErrors({});
      setImagePreview(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicle: vehicleId,
        driver: driverId,
      }));
    }
  }, [isOpen, vehicleId, driverId]);

  useEffect(() => {
    if (success) {
      addToast({
        title: "Success",
        description: "Fuel log created successfully",
        severity: "success",
      });
      // onClose();
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        addToast({
          title: "Invalid File",
          description: "Please select an image file",
          severity: "warning",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "File Too Large",
          description: "Image must be less than 5MB",
          severity: "warning",
        });
        return;
      }

      setFormData((prev) => ({ ...prev, receipt_image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.liters || parseFloat(formData.liters) <= 0) {
      newErrors.liters = "Liters must be greater than 0";
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = "Cost must be greater than 0";
    }

    if (
      !formData.odometer_reading_km ||
      parseInt(formData.odometer_reading_km) < 0
    ) {
      newErrors.odometer_reading_km = "Odometer reading must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("vehicle", formData.vehicle);
      submitData.append("driver", formData.driver);
      submitData.append("liters", parseFloat(formData.liters));
      submitData.append("cost", parseFloat(formData.cost));
      submitData.append(
        "odometer_reading_km",
        parseInt(formData.odometer_reading_km)
      );
      if (formData.fuel_station_name) {
        submitData.append("fuel_station_name", formData.fuel_station_name);
      }
      if (formData.receipt_image) {
        submitData.append("receipt_image", formData.receipt_image);
      }

      onSubmit(submitData);
    }
  };

  const isFormValid =
    formData.liters &&
    parseFloat(formData.liters) > 0 &&
    formData.cost &&
    parseFloat(formData.cost) > 0 &&
    formData.odometer_reading_km &&
    parseInt(formData.odometer_reading_km) >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">Enter Fuel Log</h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Liters"
                type="number"
                step="0.01"
                placeholder="e.g., 50.5"
                value={formData.liters}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, liters: e.target.value }))
                }
                isRequired
                isInvalid={!!errors.liters}
                errorMessage={errors.liters}
              />

              <Input
                label="Cost"
                type="number"
                step="0.01"
                placeholder="e.g., 1250.00"
                value={formData.cost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cost: e.target.value }))
                }
                isRequired
                isInvalid={!!errors.cost}
                errorMessage={errors.cost}
              />
            </div>

            <Input
              label="Odometer Reading (km)"
              type="number"
              placeholder="e.g., 125000"
              value={formData.odometer_reading_km}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  odometer_reading_km: e.target.value,
                }))
              }
              isRequired
              isInvalid={!!errors.odometer_reading_km}
              errorMessage={errors.odometer_reading_km}
            />

            <Input
              label="Fuel Station Name"
              placeholder="e.g., Shell Station"
              value={formData.fuel_station_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  fuel_station_name: e.target.value,
                }))
              }
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Receipt Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="max-w-full h-auto max-h-48 rounded-lg border border-divider"
                  />
                </div>
              )}
            </div>
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
            {loading ? "Submitting..." : "Submit Fuel Log"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
