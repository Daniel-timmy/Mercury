import React from "react";
import { Outlet } from "react-router-dom";
import { SidePanel } from "../../components/SidePanel";

const DriverLayout = () => {
  let mainMenuItems = [
    { label: "Dashboard", key: "dashboard", apiEndpoint: null },
    { label: "Chats", key: "chats", apiEndpoint: "/" },
    { label: "Trips", key: "trip", apiEndpoint: "trips/" },
    { label: "Map", key: "map", apiEndpoint: null },
    {
      label: "Truck",
      key: "truck",
      apiEndpoint: null,
    },
    { label: "Settings", key: "settings", apiEndpoint: null },
  ];

  return (
    <div className="flex">
      <div className="lg:w-80">
        <SidePanel mainMenuItems={mainMenuItems} />
      </div>
      <div className="flex-1">
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
