import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
  addToast,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faTruckFast,
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

const DriverLogin = () => {
  const navigate = useNavigate();

  // State for login form fields
  const [logEmail, setLogEmail] = useState("");
  const [logPassword, setLogPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /**
   * Validates login form fields in real-time
   */
  const validateLoginForm = () => {
    let isValid = true;

    if (!logEmail) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(logEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!logPassword) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (logPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  /**
   * Handles the driver login form submission.
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

      const decodedToken = jwtDecode(res.data.access);
      console.log("Decoded Token for driver:", decodedToken); // Debugging line
      Cookies.set("driver_id", decodedToken.driver_id, {
        secure: true,
        sameSite: "strict",
      });
      if (decodedToken.user_id) {
        Cookies.set("driver_id", decodedToken.user_id, {
          secure: true,
          sameSite: "strict",
        });
      }
      const driver = await api.get(`/users/drivers/${decodedToken.user_id}/`);
      if (driver.data && driver.data.id) {
        Cookies.set(decodedToken.user_id, JSON.stringify(driver.data), {
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

      // Navigate to driver dashboard after successful login
      setTimeout(() => {
        navigate("/driver/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 via-primary-50 to-success-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-col gap-3 items-center pt-8 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-success-500 to-primary-500">
            <FontAwesomeIcon
              icon={faTruckFast}
              className="text-white"
              style={{ fontSize: "2rem" }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold text-foreground">Driver Login</h1>
            <p className="text-sm text-default-500">
              Sign in to your driver account
            </p>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="px-8 py-6">
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
              isInvalid={!!emailError}
              errorMessage={emailError}
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
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Enter your password"
              value={logPassword}
              onChange={(e) => setLogPassword(e.target.value)}
              isInvalid={!!passwordError}
              errorMessage={passwordError}
              startContent={
                <FontAwesomeIcon icon={faLock} className="text-default-400" />
              }
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
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
              color="success"
              size="lg"
              className="mt-2 font-semibold"
              isLoading={isLoading}
              isDisabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardBody>

        <Divider />

        <CardFooter className="flex flex-col gap-2 px-8 py-4">
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-default-500">
              Need help accessing your account?
            </span>
          </div>
          <p className="text-xs text-center text-default-400">
            Contact your manager for assistance
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DriverLogin;
