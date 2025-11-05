import { Outlet } from "react-router-dom";
import React from "react";
import { SidePanel } from "../../components/SidePanel";

const ManagerLayout = () => {
  let mainMenuItems = [
    { label: "Dashboard", key: "dashboard", apiEndpoint: null },
    { label: "Chats", key: "chats", apiEndpoint: "/" },
    { label: "Trips", key: "trip", apiEndpoint: "trips/" },
    { label: "Map", key: "map", apiEndpoint: null },
    { label: "Settings", key: "settings", apiEndpoint: null },

    {
      label: "Drivers",
      key: "drivers",
      apiEndpoint: null,
    },
    {
      label: "Trucks",
      key: "trucks",
      apiEndpoint: "trucks/",
    },
  ];
  return (
    <div className="flex">
      <div className="w-80">
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

export default ManagerLayout;
