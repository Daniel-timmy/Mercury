import React from "react";
import usePositionRealTime from "../hooks/usePositionRealTime";

export const DriverPositionContext = React.createContext(null);

export const DriverPositionProvider = ({ children }) => {
  const { position } = usePositionRealTime();

  return (
    <DriverPositionContext.Provider value={{ position }}>
      {children}
    </DriverPositionContext.Provider>
  );
};
