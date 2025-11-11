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
} from "@heroui/react";
import { addToast } from "@heroui/react";

/**
 * Modal component for creating new fleet
 */
export function CreateFleetModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  success = false,
  managers = [],
}) {
  const [formData, setFormData] = useState({
    name: "",
    manager: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        manager: null,
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (success) {
      addToast({
        title: "Success",
        description: "Fleet created successfully",
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

    if (!formData.name.trim()) {
      newErrors.name = "Fleet name is required";
    }

    if (!formData.manager) {
      newErrors.manager = "Manager is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.name.trim() && formData.manager;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">Create New Fleet</h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Fleet Name"
              placeholder="Enter fleet name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              isRequired
              isInvalid={!!errors.name}
              errorMessage={errors.name}
            />

            <Select
              label="Manager"
              placeholder="Select manager"
              selectedKeys={
                formData.manager ? [formData.manager.toString()] : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setFormData((prev) => ({ ...prev, manager: value }));
              }}
              isRequired
              isInvalid={!!errors.manager}
              errorMessage={errors.manager}
            >
              {managers.map((manager) => (
                <SelectItem
                  key={manager.id.toString()}
                  value={manager.id.toString()}
                >
                  {manager.name}
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
            {loading ? "Creating..." : "Create Fleet"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
