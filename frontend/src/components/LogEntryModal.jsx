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
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";

const DUTY_STATUS_OPTIONS = [
  { key: "on_duty", label: "On Duty" },
  { key: "off_duty", label: "Off Duty" },
  { key: "driving", label: "Driving" },
  { key: "sleeper_berth", label: "Sleeper Berth" },
];

/**
 * Generates time options in HH:mm format with 15-minute increments
 */
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      times.push(timeString);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

/**
 * Generates span options (duration in hours)
 */
const generateSpanOptions = () => {
  const spans = [];
  for (let i = 0.25; i <= 24; i += 0.25) {
    const hours = Math.floor(i);
    const minutes = (i % 1) * 60;
    const label =
      minutes === 0
        ? `${hours}:00`
        : `${hours}:${minutes.toString().padStart(2, "0")}`;
    spans.push({ key: label, label: label });
  }
  return spans;
};

const SPAN_OPTIONS = generateSpanOptions();

/**
 * Modal component for creating a new log entry
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {string} props.logId - The log ID to associate with this entry
 */
export function LogEntryModal({ isOpen, onClose, onSubmit, logId }) {
  const [formData, setFormData] = useState({
    startTime: "08:00",
    span: "1:00",
    location: "",
    duty_status: "on_duty",
    activity: "",
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

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!formData.span) {
      newErrors.span = "Duration is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.duty_status) {
      newErrors.duty_status = "Duty status is required";
    }
    if (!formData.activity.trim()) {
      newErrors.activity = "Activity description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);

      // Prepare the data to match the API format
      const entryData = {
        log_id: logId,
        span: formData.span,
        startTime: formData.startTime,
        location: formData.location,
        duty_status: formData.duty_status,
        activity: formData.activity,
      };

      try {
        await onSubmit(entryData);

        addToast({
          title: "Success",
          description: "Log entry created successfully!",
          color: "success",
          timeout: 5000,
        });

        // Reset form
        setFormData({
          startTime: "08:00",
          span: "1:00",
          location: "",
          duty_status: "on_duty",
          activity: "",
        });
        setErrors({});
        onClose();
      } catch (error) {
        addToast({
          title: "Error",
          description: error.message || "Failed to create log entry",
          color: "danger",
          timeout: 5000,
        });
      } finally {
        setLoading(false);
      }
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
          <h2 className="text-xl font-semibold">New Log Entry</h2>
          <p className="text-sm text-foreground/60 font-normal">
            Add a new entry to the driver's record of duty status
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-5">
            {/* Time Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Time Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Start Time"
                  placeholder="Select start time"
                  selectedKeys={[formData.startTime]}
                  onSelectionChange={(keys) =>
                    handleChange("startTime", Array.from(keys)[0])
                  }
                  isRequired
                  isInvalid={!!errors.startTime}
                  errorMessage={errors.startTime}
                  variant="bordered"
                  classNames={{
                    trigger: "h-12",
                  }}
                >
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Duration (Span)"
                  placeholder="Select duration"
                  selectedKeys={[formData.span]}
                  onSelectionChange={(keys) =>
                    handleChange("span", Array.from(keys)[0])
                  }
                  isRequired
                  isInvalid={!!errors.span}
                  errorMessage={errors.span}
                  variant="bordered"
                  classNames={{
                    trigger: "h-12",
                  }}
                >
                  {SPAN_OPTIONS.map((span) => (
                    <SelectItem key={span.key} value={span.key}>
                      {span.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Duty Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Duty Status
              </h3>
              <Select
                label="Status"
                placeholder="Select duty status"
                selectedKeys={[formData.duty_status]}
                onSelectionChange={(keys) =>
                  handleChange("duty_status", Array.from(keys)[0])
                }
                isRequired
                isInvalid={!!errors.duty_status}
                errorMessage={errors.duty_status}
                variant="bordered"
                classNames={{
                  trigger: "h-12",
                }}
              >
                {DUTY_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Location
              </h3>
              <Input
                label="Location"
                placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
                value={formData.location}
                onValueChange={(value) => handleChange("location", value)}
                isRequired
                isInvalid={!!errors.location}
                errorMessage={errors.location}
                variant="bordered"
              />
            </div>

            {/* Activity Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Activity
              </h3>
              <Input
                label="Activity Description"
                placeholder="e.g., Driving to pickup location"
                value={formData.activity}
                onValueChange={(value) => handleChange("activity", value)}
                isRequired
                isInvalid={!!errors.activity}
                errorMessage={errors.activity}
                variant="bordered"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            variant="flat"
            onPress={handleClose}
            isDisabled={loading}
          >
            Cancel
          </Button>
          {loading ? (
            <Button color="primary" isDisabled className="min-w-[100px]">
              <Spinner size="sm" color="white" />
            </Button>
          ) : (
            <Button color="primary" onPress={handleSubmit}>
              Submit Entry
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
