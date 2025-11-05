import React from "react";
import { Outlet } from "react-router-dom";
import { SidePanel } from "../../components/SidePanel";

const AdminLayout = () => {
  let mainMenuItems = [
    { label: "Dashboard", key: "dashboard", apiEndpoint: null },
    { label: "Chats", key: "chats", apiEndpoint: "chats/" },
    { label: "Trips", key: "trip", apiEndpoint: "trips/" },
    { label: "Map", key: "map", apiEndpoint: null },
    { label: "Settings", key: "settings", apiEndpoint: null },
    {
      label: "Fleets",
      key: "fleets",
      apiEndpoint: "fleets/",
    },
    {
      label: "Personnels",
      key: "personnels",
      apiEndpoint: null,
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

export default AdminLayout;
