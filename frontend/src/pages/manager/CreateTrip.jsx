import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Button,
  Spinner,
  DatePicker,
  addToast,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from "@fortawesome/free-solid-svg-icons";
import { usePersonnelData } from "../../hooks/usePersonnelData";
import api from "../../hooks/api";
import { parseDate } from "@internationalized/date";

const CreateTrip = () => {
  const navigate = useNavigate();

  // Fetch drivers list
  const { results: drivers, loading: driversLoading } =
    usePersonnelData("users/drivers");

  // Form state
  const [formData, setFormData] = useState({
    driver: "",
    start_location: "",
    pickup_location: "",
    dropoff_location: "",
    start_date: null,
    duration_days: "",
    status: "",
    shipper: "",
    commodity: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.driver) {
      newErrors.driver = "Driver is required";
    }
    if (!formData.start_location.trim()) {
      newErrors.start_location = "Start location is required";
    }
    if (!formData.pickup_location.trim()) {
      newErrors.pickup_location = "Pickup location is required";
    }
    if (!formData.dropoff_location.trim()) {
      newErrors.dropoff_location = "Dropoff location is required";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    if (!formData.duration_days || formData.duration_days <= 0) {
      newErrors.duration_days = "Duration must be greater than 0";
    }
    if (!formData.status) {
      newErrors.status = "Status is required";
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        color: "danger",
        timeout: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date to YYYY-MM-DD
      const formattedDate = `${formData.start_date.year}-${String(
        formData.start_date.month
      ).padStart(2, "0")}-${String(formData.start_date.day).padStart(2, "0")}`;

      const payload = {
        driver: formData.driver,
        start_location: formData.start_location,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        start_date: formattedDate,
        duration_days: parseInt(formData.duration_days),
        status: formData.status,
        shipper: formData.shipper,
        commodity: formData.commodity,
      };

      const response = await api.post("trips/", payload);

      if (response.status === 201 || response.status === 200) {
        addToast({
          title: "Success",
          description: "Trip created successfully!",
          color: "success",
          timeout: 3000,
        });

        // Navigate back to trips list or to the new trip detail page
        setTimeout(() => {
          navigate(-1); // Go back to previous page
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating trip:", error);

      let errorMessage = "Failed to create trip. Please try again.";

      if (error.response?.data) {
        // Handle specific field errors
        if (typeof error.response.data === "object") {
          const fieldErrors = {};
          Object.keys(error.response.data).forEach((key) => {
            const messages = error.response.data[key];
            fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
            errorMessage = fieldErrors[key];
          });
          setErrors(fieldErrors);
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      }

      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-divider bg-content1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={handleCancel}
              className="text-foreground"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Create New Trip
              </h2>
              <p className="text-sm text-foreground/60 mt-1">
                Fill in the details to create a new trip
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card shadow="md" className="border border-divider/50">
          <CardHeader className="flex flex-col items-start gap-2 p-6 border-b border-divider bg-content2">
            <h3 className="text-lg font-semibold text-foreground">
              Trip Information
            </h3>
            <p className="text-sm text-foreground/60">
              All fields marked with * are required
            </p>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Driver Selection */}
              <div className="space-y-2">
                <Select
                  label="Driver"
                  placeholder="Select a driver"
                  selectedKeys={formData.driver ? [formData.driver] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    handleChange("driver", selectedKey);
                  }}
                  isRequired
                  isInvalid={!!errors.driver}
                  errorMessage={errors.driver}
                  variant="bordered"
                  isLoading={driversLoading}
                  isDisabled={driversLoading}
                  classNames={{
                    trigger: "min-h-unit-12",
                  }}
                >
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name || `Driver ${driver.id}`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Location Fields - Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Location"
                  placeholder="Enter start location"
                  value={formData.start_location}
                  onValueChange={(value) =>
                    handleChange("start_location", value)
                  }
                  isRequired
                  isInvalid={!!errors.start_location}
                  errorMessage={errors.start_location}
                  variant="bordered"
                />

                <Input
                  label="Pickup Location"
                  placeholder="Enter pickup location"
                  value={formData.pickup_location}
                  onValueChange={(value) =>
                    handleChange("pickup_location", value)
                  }
                  isRequired
                  isInvalid={!!errors.pickup_location}
                  errorMessage={errors.pickup_location}
                  variant="bordered"
                />

                <Input
                  label="Dropoff Location"
                  placeholder="Enter dropoff location"
                  value={formData.dropoff_location}
                  onValueChange={(value) =>
                    handleChange("dropoff_location", value)
                  }
                  isRequired
                  isInvalid={!!errors.dropoff_location}
                  errorMessage={errors.dropoff_location}
                  variant="bordered"
                  className="md:col-span-2"
                />
              </div>

              {/* Date and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date) => handleChange("start_date", date)}
                  isRequired
                  isInvalid={!!errors.start_date}
                  errorMessage={errors.start_date}
                  variant="bordered"
                  showMonthAndYearPickers
                />

                <Input
                  type="number"
                  label="Duration (Days)"
                  placeholder="Enter duration in days"
                  value={formData.duration_days}
                  onValueChange={(value) =>
                    handleChange("duration_days", value)
                  }
                  isRequired
                  isInvalid={!!errors.duration_days}
                  errorMessage={errors.duration_days}
                  variant="bordered"
                  min={1}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Select
                  label="Status"
                  placeholder="Select trip status"
                  selectedKeys={formData.status ? [formData.status] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    handleChange("status", selectedKey);
                  }}
                  isRequired
                  isInvalid={!!errors.status}
                  errorMessage={errors.status}
                  variant="bordered"
                  classNames={{
                    trigger: "min-h-unit-12",
                  }}
                >
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Shipper and Commodity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Shipper"
                  placeholder="Enter shipper name"
                  value={formData.shipper}
                  onValueChange={(value) => handleChange("shipper", value)}
                  isRequired
                  isInvalid={!!errors.shipper}
                  errorMessage={errors.shipper}
                  variant="bordered"
                />

                <Input
                  label="Commodity"
                  placeholder="Enter commodity type"
                  value={formData.commodity}
                  onValueChange={(value) => handleChange("commodity", value)}
                  isRequired
                  isInvalid={!!errors.commodity}
                  errorMessage={errors.commodity}
                  variant="bordered"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-divider">
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleCancel}
                  className="w-full sm:w-auto min-w-[140px]"
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  className="w-full sm:w-auto min-w-[140px]"
                  isLoading={isSubmitting}
                  startContent={
                    !isSubmitting && <FontAwesomeIcon icon={faSave} />
                  }
                >
                  {isSubmitting ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default CreateTrip;
