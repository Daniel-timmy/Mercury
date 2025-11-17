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
  Switch,
  Textarea,
} from "@heroui/react";
import { addToast } from "@heroui/react";

const ALERT_TYPES = [
  { value: "Oil Change", label: "Oil Change" },
  { value: "Tire Rotation", label: "Tire Rotation" },
  { value: "Brake Inspection", label: "Brake Inspection" },
  { value: "Engine Check", label: "Engine Check" },
  { value: "General Maintenance", label: "General Maintenance" },
  { value: "Battery Check", label: "Battery Check" },
  { value: "Coolant Check", label: "Coolant Check" },
  { value: "Other", label: "Other" },
];

/**
 * Modal component for creating and editing maintenance alerts
 */
export function MaintenanceAlertModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  vehicleId = null,
  editMode = false,
  alertData = null,
}) {
  const [formData, setFormData] = useState({
    vehicle: vehicleId,
    alert_type: "",
    is_resolved: false,
    resolved_at: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        vehicle: vehicleId,
        alert_type: "",
        is_resolved: false,
        resolved_at: "",
        notes: "",
      });
      setErrors({});
    } else if (editMode && alertData) {
      // Populate form with existing data for editing
      setFormData({
        vehicle: alertData.vehicle || vehicleId,
        alert_type: alertData.alert_type || "",
        is_resolved: alertData.is_resolved || false,
        resolved_at: alertData.resolved_at
          ? new Date(alertData.resolved_at).toISOString().slice(0, 16)
          : "",
        notes: alertData.notes || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicle: vehicleId,
      }));
    }
  }, [isOpen, vehicleId, editMode, alertData]);

  useEffect(() => {
    if (success) {
      addToast({
        title: "Success",
        description: editMode
          ? "Maintenance alert updated successfully"
          : "Maintenance alert created successfully",
        severity: "success",
      });
    }
  }, [success, editMode]);

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

    if (!formData.alert_type) {
      newErrors.alert_type = "Alert type is required";
    }

    if (formData.is_resolved && !formData.resolved_at) {
      newErrors.resolved_at = "Resolved date is required when alert is marked as resolved";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        vehicle: formData.vehicle,
        alert_type: formData.alert_type,
        is_resolved: formData.is_resolved,
        notes: formData.notes,
      };

      // Only include resolved_at if the alert is resolved
      if (formData.is_resolved && formData.resolved_at) {
        submitData.resolved_at = new Date(formData.resolved_at).toISOString();
      }

      onSubmit(submitData);
    }
  };

  const isFormValid = formData.alert_type && (!formData.is_resolved || formData.resolved_at);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">
            {editMode ? "Edit Maintenance Alert" : "Create Maintenance Alert"}
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Select
              label="Alert Type"
              placeholder="Select alert type"
              selectedKeys={formData.alert_type ? [formData.alert_type] : []}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, alert_type: e.target.value }))
              }
              isRequired
              isInvalid={!!errors.alert_type}
              errorMessage={errors.alert_type}
            >
              {ALERT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <div className="flex items-center gap-3">
              <Switch
                isSelected={formData.is_resolved}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_resolved: value,
                    resolved_at: value ? prev.resolved_at : "",
                  }))
                }
              >
                Mark as Resolved
              </Switch>
            </div>

            {formData.is_resolved && (
              <Input
                label="Resolved Date & Time"
                type="datetime-local"
                value={formData.resolved_at}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    resolved_at: e.target.value,
                  }))
                }
                isRequired={formData.is_resolved}
                isInvalid={!!errors.resolved_at}
                errorMessage={errors.resolved_at}
              />
            )}

            <Textarea
              label="Notes"
              placeholder="Enter any additional notes about this maintenance alert..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              minRows={4}
            />
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
              ? "Submitting..."
              : editMode
              ? "Update Alert"
              : "Create Alert"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}