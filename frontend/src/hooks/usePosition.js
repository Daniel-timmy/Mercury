import { useContext } from "react";
import { DriverPositionContext } from "../context/DriverPositionContext";

export const usePositionContext = () => {
  const context = useContext(DriverPositionContext);
  if (context === null) {
    throw new Error(
      "usePositionContext must be used within a DriverPositionProvider"
    );
  }
  return context;
};
