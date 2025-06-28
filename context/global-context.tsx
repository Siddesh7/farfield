import { createContext, useContext, useState, ReactNode } from "react";
import { ModulesType } from "@/types/global";

interface GlobalContextType {
  activeModule: ModulesType;
  setActiveModule: (activeModule: ModulesType) => void;
}

export const GlobalContext = createContext<GlobalContextType | undefined>(
  undefined
);

export const GlobalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activeModule, setActiveModule] = useState<ModulesType>("home");

  const value = {
    activeModule,
    setActiveModule,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalContext must be used within a GlobalContextProvider"
    );
  }
  return context;
};
