import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Link,
  Divider,
  addToast,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faKey,
  faEye,
  faEyeSlash,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../hooks/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

/**
 * Validates if the provided email is in a valid format.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const AdminAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Replace isRegister with local state
  const [isRegister, setIsRegister] = useState(
    location.pathname.includes("register")
  );

  // State for registration form fields
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAccessKey, setRegAccessKey] = useState("");

  // State for login form fields
  const [logEmail, setLogEmail] = useState("");
  const [logPassword, setLogPassword] = useState("");

  // UI state
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showLogPassword, setShowLogPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [regEmailError, setRegEmailError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");
  const [regNameError, setRegNameError] = useState("");
  const [regAccessKeyError, setRegAccessKeyError] = useState("");
  const [logEmailError, setLogEmailError] = useState("");
  const [logPasswordError, setLogPasswordError] = useState("");

  const switchMode = () => {
    // Clear all errors when switching modes
    setRegEmailError("");
    setRegPasswordError("");
    setRegNameError("");
    setRegAccessKeyError("");
    setLogEmailError("");
    setLogPasswordError("");

    // Toggle between register and login forms locally
    setIsRegister((prev) => !prev);
  };

  /**
   * Validates registration form fields in real-time
   */
  const validateRegisterForm = () => {
    let isValid = true;

    if (!regEmail) {
      setRegEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(regEmail)) {
      setRegEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setRegEmailError("");
    }

    if (!regPassword) {
      setRegPasswordError("Password is required");
      isValid = false;
    } else if (regPassword.length < 8) {
      setRegPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else {
      setRegPasswordError("");
    }

    if (!regName.trim()) {
      setRegNameError("Name is required");
      isValid = false;
    } else {
      setRegNameError("");
    }

    if (!regAccessKey.trim()) {
      setRegAccessKeyError("Access key is required");
      isValid = false;
    } else {
      setRegAccessKeyError("");
    }

    return isValid;
  };

  /**
   * Validates login form fields in real-time
   */
  const validateLoginForm = () => {
    let isValid = true;

    if (!logEmail) {
      setLogEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(logEmail)) {
      setLogEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setLogEmailError("");
    }

    if (!logPassword) {
      setLogPasswordError("Password is required");
      isValid = false;
    } else if (logPassword.length < 8) {
      setLogPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else {
      setLogPasswordError("");
    }

    return isValid;
  };

  /**
   * Handles the admin registration form submission.
   * Performs validation on form fields and sends data to the API if valid.
   * Displays toast messages for success or errors.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/users/admins/", {
        email: regEmail,
        password: regPassword,
        name: regName.trim(),
        role: "admin",
        access_key: regAccessKey.trim(),
      });

      addToast({
        title: "Success",
        description: "Admin registered successfully. Please login to continue.",
        severity: "success",
      });

      // Clear form fields on success
      setRegEmail("");
      setRegPassword("");
      setRegName("");
      setRegAccessKey("");

      // Navigate to login after successful registration
      // setTimeout(() => {
      //   navigate("/admin/login");
      // }, 1500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "An error occurred during registration.";
      addToast({
        title: "Registration Failed",
        description: errorMessage,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the admin login form submission.
   * Performs validation on form fields and sends data to the API if valid.
   * Displays toast messages for success or errors.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submit event.
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/users/auth/login/", {
        email: logEmail,
        password: logPassword,
      });

      // Set access and refresh tokens in cookies
      Cookies.set("access", res.data.access, {
        secure: true,
        sameSite: "strict",
      });
      Cookies.set("refresh", res.data.refresh, {
        secure: true,
        sameSite: "strict",
      });

      // Decode and store admin_id from JWT token
      const decodedToken = jwtDecode(res.data.access);
      console.log("Decoded Token for admin:", decodedToken);

      // console.log("Fetched Admin Data:", admin.data);
      if (decodedToken.user_id) {
        Cookies.set("admin_id", decodedToken.user_id, {
          secure: true,
          sameSite: "strict",
        });
      }
      const admin = await api.get(`/users/admins/${decodedToken.user_id}/`);
      if (admin.data && admin.data.id) {
        Cookies.set(decodedToken.user_id, JSON.stringify(admin.data), {
          secure: true,
          sameSite: "strict",
        });
      }

      addToast({
        title: "Success",
        description: "Logged in successfully. Redirecting...",
        severity: "success",
      });

      // Clear form fields on success
      setLogEmail("");
      setLogPassword("");

      // Navigate to admin dashboard after successful login
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "An error occurred during login.";
      addToast({
        title: "Login Failed",
        description: errorMessage,
        severity: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="text-white"
              style={{ fontSize: "2rem" }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold text-foreground">
              {isRegister ? "Admin Registration" : "Admin Login"}
            </h1>
            <p className="text-sm text-default-500">
              {isRegister
                ? "Create a new admin account"
                : "Sign in to your admin account"}
            </p>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="px-8 py-6">
          {isRegister ? (
            <form
              onSubmit={handleRegister}
              className="flex flex-col gap-4 text-black"
            >
              <Input
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                className="text-black"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                isInvalid={!!regNameError}
                errorMessage={regNameError}
                startContent={
                  <FontAwesomeIcon icon={faUser} className="text-default-400" />
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                isInvalid={!!regEmailError}
                errorMessage={regEmailError}
                startContent={
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-default-400"
                  />
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Input
                type={showRegPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                isInvalid={!!regPasswordError}
                errorMessage={regPasswordError}
                startContent={
                  <FontAwesomeIcon icon={faLock} className="text-default-400" />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="focus:outline-none"
                  >
                    <FontAwesomeIcon
                      icon={showRegPassword ? faEyeSlash : faEye}
                      className="text-default-400"
                    />
                  </button>
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Input
                type="text"
                label="Access Key"
                placeholder="Enter admin access key"
                value={regAccessKey}
                onChange={(e) => setRegAccessKey(e.target.value)}
                isInvalid={!!regAccessKeyError}
                errorMessage={regAccessKeyError}
                startContent={
                  <FontAwesomeIcon icon={faKey} className="text-default-400" />
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <div className="flex items-center gap-2 px-1 py-2 bg-default-100 rounded-lg">
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="text-primary-500"
                />
                <span className="text-sm text-default-600">
                  Role: <span className="font-semibold">Admin</span>
                </span>
              </div>

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="mt-2 font-semibold"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-4 text-black"
            >
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
                isInvalid={!!logEmailError}
                errorMessage={logEmailError}
                startContent={
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-default-400"
                  />
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Input
                type={showLogPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={logPassword}
                onChange={(e) => setLogPassword(e.target.value)}
                isInvalid={!!logPasswordError}
                errorMessage={logPasswordError}
                startContent={
                  <FontAwesomeIcon icon={faLock} className="text-default-400" />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowLogPassword(!showLogPassword)}
                    className="focus:outline-none"
                  >
                    <FontAwesomeIcon
                      icon={showLogPassword ? faEyeSlash : faEye}
                      className="text-default-400"
                    />
                  </button>
                }
                variant="bordered"
                isRequired
                isDisabled={isLoading}
              />

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="mt-2 font-semibold"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}
        </CardBody>

        <Divider />

        <CardFooter className="flex flex-col gap-2 px-8 py-4">
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-default-500">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>
            <Link
              size="sm"
              onPress={switchMode}
              className="cursor-pointer font-semibold"
              isDisabled={isLoading}
            >
              {isRegister ? "Login" : "Register"}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminAuth;
