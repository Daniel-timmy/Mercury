import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Input,
  addToast,
} from "@heroui/react";

/**
 * Modal component for creating a new logsheet
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when form is submitted
 */
export function LogsheetModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    driver: "",
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    vehicle_no: "",
    trailer_no: "",
    shipper: "",
    commodity: "",
    current_cycle_hours: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.driver.trim()) {
      newErrors.driver = "Driver name is required";
    }
    if (!formData.vehicle_no.trim()) {
      newErrors.vehicle_no = "Vehicle number is required";
    }
    if (!formData.trailer_no.trim()) {
      newErrors.trailer_no = "Trailer number is required";
    }
    if (formData.current_cycle_hours < 0) {
      newErrors.current_cycle_hours = "Hours cannot be negative";
    }
    if (!formData.current_location.trim()) {
      newErrors.current_location = "Current location is required";
    }
    if (!formData.pickup_location.trim()) {
      newErrors.pickup_location = "Pickup location is required";
    }
    if (!formData.dropoff_location.trim()) {
      newErrors.dropoff_location = "Dropoff location is required";
    }
    if (!formData.shipper.trim()) {
      newErrors.shipper = "Shipper is required";
    }
    if (!formData.commodity.trim()) {
      newErrors.commodity = "Commodity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      onSubmit(formData, {
        onSuccess: () => {
          addToast({
            title: "Success",
            description: "Logsheet created successfully!",
            color: "success",
            timeout: 3000,
          });
          setFormData({
            driver: "",
            current_location: "",
            pickup_location: "",
            dropoff_location: "",
            vehicle_no: "",
            trailer_no: "",
            shipper: "",
            commodity: "",
            current_cycle_hours: 0,
          });
          setErrors({});
          setLoading(false);
          onClose();
        },
        onError: (errorMessage) => {
          addToast({
            title: "Error",
            description: errorMessage || "Failed to create logsheet",
            color: "danger",
            timeout: 5000,
          });
          setLoading(false);
        },
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Create Logsheet</h2>
          <p className="text-sm text-foreground/60 font-normal">
            Fill in the details to create a new logsheet
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {/* Driver Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                Driver Information
              </h3>
              <Input
                label="Driver Name"
                placeholder="Enter driver name"
                value={formData.driver}
                onValueChange={(value) => handleChange("driver", value)}
                isRequired
                isInvalid={!!errors.driver}
                errorMessage={errors.driver}
                variant="bordered"
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                Location Information
              </h3>
              <Input
                label="Current Location"
                placeholder="Enter current location"
                value={formData.current_location}
                isRequired
                isInvalid={!!errors.current_location}
                errorMessage={errors.current_location}
                onValueChange={(value) =>
                  handleChange("current_location", value)
                }
                variant="bordered"
              />
              <Input
                label="Pickup Location"
                placeholder="Enter pickup location"
                isRequired
                isInvalid={!!errors.pickup_location}
                errorMessage={errors.pickup_location}
                value={formData.pickup_location}
                onValueChange={(value) =>
                  handleChange("pickup_location", value)
                }
                variant="bordered"
              />
              <Input
                label="Dropoff Location"
                placeholder="Enter dropoff location"
                value={formData.dropoff_location}
                isRequired
                isInvalid={!!errors.dropoff_location}
                errorMessage={errors.dropoff_location}
                onValueChange={(value) =>
                  handleChange("dropoff_location", value)
                }
                variant="bordered"
              />
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                Vehicle Information
              </h3>
              <Input
                label="Vehicle Number"
                placeholder="e.g., ABC-123"
                value={formData.vehicle_no}
                onValueChange={(value) => handleChange("vehicle_no", value)}
                isRequired
                isInvalid={!!errors.vehicle_no}
                errorMessage={errors.vehicle_no}
                variant="bordered"
              />
              <Input
                label="Trailer Number"
                placeholder="e.g., XYZ-456"
                value={formData.trailer_no}
                onValueChange={(value) => handleChange("trailer_no", value)}
                isRequired
                isInvalid={!!errors.trailer_no}
                errorMessage={errors.trailer_no}
                variant="bordered"
              />
            </div>

            {/* Shipment Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                Shipment Information
              </h3>
              <Input
                label="Shipper"
                placeholder="Enter shipper name"
                isRequired
                isInvalid={!!errors.shipper}
                errorMessage={errors.shipper}
                value={formData.shipper}
                onValueChange={(value) => handleChange("shipper", value)}
                variant="bordered"
              />
              <Input
                label="Commodity"
                placeholder="Enter commodity type"
                isRequired
                isInvalid={!!errors.commodity}
                errorMessage={errors.commodity}
                value={formData.commodity}
                onValueChange={(value) => handleChange("commodity", value)}
                variant="bordered"
              />
            </div>

            {/* Hours Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                Hours Information
              </h3>
              <Input
                type="number"
                label="Current Cycle Hours"
                placeholder="0"
                value={formData.current_cycle_hours.toString()}
                onValueChange={(value) =>
                  handleChange("current_cycle_hours", parseFloat(value) || 0)
                }
                isInvalid={!!errors.current_cycle_hours}
                errorMessage={errors.current_cycle_hours}
                variant="bordered"
                min={0}
                step={0.5}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="flat" onPress={handleClose}>
            Cancel
          </Button>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Button color="primary" onPress={handleSubmit}>
              Submit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
