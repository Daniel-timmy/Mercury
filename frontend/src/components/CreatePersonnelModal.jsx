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
 * Modal component for creating new personnel
 */
export function CreatePersonnelModal({
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
    email: "",
    password: "",
    role: "",
    manager: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        manager: null,
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (success) {
      addToast({
        title: "Success",
        description: "Personnel created successfully",
        severity: "success",
      });
      onClose();
    }
  }, [success, onClose]);

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        manager: formData.manager || null,
      };
      console.log("Submitting:", submitData);
      onSubmit(submitData);
    }
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
      manager: value === "admin" || value === "manager" ? null : prev.manager,
    }));
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    validateEmail(formData.email) &&
    formData.password.length >= 6 &&
    formData.role;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">Create New Personnel</h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              isRequired
              isInvalid={!!errors.name}
              errorMessage={errors.name}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              isRequired
              isInvalid={!!errors.email}
              errorMessage={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              isRequired
              isInvalid={!!errors.password}
              errorMessage={errors.password}
            />

            <Select
              label="Role"
              placeholder="Select role"
              selectedKeys={formData.role ? [formData.role] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                handleRoleChange(value);
              }}
              isRequired
              isInvalid={!!errors.role}
              errorMessage={errors.role}
            >
              <SelectItem key="admin" value="admin">
                Admin
              </SelectItem>
              <SelectItem key="manager" value="manager">
                Manager
              </SelectItem>
              <SelectItem key="driver" value="driver">
                Driver
              </SelectItem>
            </Select>

            {formData.role === "driver" && (
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
            )}
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
            {loading ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
