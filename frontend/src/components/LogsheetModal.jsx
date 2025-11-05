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
 * @param {string|number} [props.tripId] - Trip ID for the logsheet
 */
export function LogsheetModal({ isOpen, onClose, onSubmit, tripId }) {
  const [formData, setFormData] = useState({
    start_location: "",
    vehicle_no: "",
    trailer_no: "",
    trip: tripId || null,
    current_cycle_hours: 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.start_location.trim()) {
      newErrors.start_location = "Start location is required";
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
            start_location: "",
            vehicle_no: "",
            trailer_no: "",
            trip: tripId || null,
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
            {/* Start Location */}
            <div className="space-y-4">
              <Input
                label="Start Location"
                placeholder="Enter start location"
                value={formData.start_location}
                onValueChange={(value) => handleChange("start_location", value)}
                isRequired
                isInvalid={!!errors.start_location}
                errorMessage={errors.start_location}
                variant="bordered"
              />
            </div>
            {/* Vehicle Number */}
            <div className="space-y-4">
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
            </div>
            {/* Trailer Number */}
            <div className="space-y-4">
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
            {/* Current Cycle Hours */}
            <div className="space-y-4">
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
            {/* Trip ID (hidden) */}
            {/* If you want to show tripId, uncomment below
            <div className="space-y-4">
              <Input
                label="Trip ID"
                value={formData.tripId || ""}
                disabled
                variant="bordered"
              />
            </div>
            */}
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
