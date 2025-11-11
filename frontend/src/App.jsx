import { useState } from "react";
import { HeroUIProvider, Button, ToastProvider } from "@heroui/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import DriverDashboard from "./pages/driver/DriverDashboard";

import ManagerLogin from "./pages/manager/ManagerLogin";
import DriverLogin from "./pages/driver/DriverLogin";
import AdminAuth from "./pages/admin/AdminAuth";

import AdminLayout from "./pages/admin/AdminLayout";
import ManagerLayout from "./pages/manager/ManagerLayout";
import DriverLayout from "./pages/driver/DriverLayout";

import ProtectedAdminRoute from "./pages/auth/ProtectedAdminRoute";
import ProtectedManagerRoute from "./pages/auth/ProtectedManagerRoute";
import ProtectedDriverRoute from "./pages/auth/ProtectedDriverRoute";

import AdminPersonnel from "./pages/admin/AdminPersonnel";
import ManagerPersonnel from "./pages/manager/MangerPersonnel";

import DriverTrip from "./pages/driver/DriverTrip";
import ManagerTrip from "./pages/manager/ManagerTrip";
import CreateTrip from "./pages/manager/CreateTrip";
import AdminTrip from "./pages/admin/AdminTrip";

import ManagerMap from "./pages/manager/ManagerMap";
import ManagerTrucks from "./pages/manager/ManagerTrucks";

import AdminFleets from "./pages/admin/AdminFleets";

import DriverTruck from "./pages/driver/DriverTruck";

import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import "./App.css";
import usePositionRealTime from "./hooks/usePositionRealTime";

function LogOut() {
  const token = Cookies.get("access");
  console.log("Logging out, token:", token);
  if (!token) {
    return <Navigate to="/driver/login" />;
  }
  const decoded = jwtDecode(token);
  const user = JSON.parse(Cookies.get(decoded.user_id));
  let route = "/driver/login";
  if (user.role === "admin") {
    route = "/admin/auth";
  } else if (user.role === "manager") {
    route = "/manager/login";
  }

  Cookies.remove("access");
  Cookies.remove("refresh");
  Cookies.remove(decoded.user_id);
  return <Navigate to={route} />;
}

function App() {
  usePositionRealTime();
  return (
    <HeroUIProvider>
      <ToastProvider placement="top-right" />

      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<DriverDashboard />} /> */}
          <Route path="/manager/login" element={<ManagerLogin />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route
            path="/admin/"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="dashboard" element={<div>Admin Dashboard</div>} />
            <Route path="personnels" element={<AdminPersonnel />} />
            <Route path="trip/:id" element={<AdminTrip />} />
            <Route path="fleets" element={<AdminFleets />} />
          </Route>
          <Route
            path="/manager/"
            element={
              <ProtectedManagerRoute>
                <ManagerLayout />
              </ProtectedManagerRoute>
            }
          >
            <Route path="dashboard" element={<div>Manager Dashboard</div>} />
            <Route path="drivers" element={<ManagerPersonnel />} />
            <Route path="trip/:id" element={<ManagerTrip />} />
            <Route path="new/trip" element={<CreateTrip />} />
            <Route path="map" element={<ManagerMap />} />
            <Route path="trucks" element={<ManagerTrucks />} />
          </Route>
          <Route
            path="/driver/"
            element={
              <ProtectedDriverRoute>
                <DriverLayout />
              </ProtectedDriverRoute>
            }
          >
            <Route path="dashboard" element={<div>Driver Dashboard</div>} />
            <Route path="trip/:id" element={<DriverTrip />} />
            <Route path="truck" element={<DriverTruck />} />
          </Route>
          <Route path="/logout" element={<LogOut />} />
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  );
}

export default App;
