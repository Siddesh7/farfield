import {
  HomeIcon,
  PlusIcon,
  ReminderIcon,
  ShoppingIcon,
  UserIcon,
} from "@/components/icons";
import { useGlobalContext } from "@/context/global-context";
import { ModulesType } from "@/types/global";
import { useCallback } from "react";

const BottomNavigation = () => {
  const { activeModule, setActiveModule } = useGlobalContext();

  const handleModuleClick = useCallback(
    (module: ModulesType) => {
      setActiveModule(module);
    },
    [setActiveModule]
  );

  return (
    <div className="flex justify-between fixed bottom-0 w-full px-10 py-3">
      <HomeIcon
        width={28}
        isActive={activeModule === "home"}
        onClick={() => handleModuleClick("home")}
      />
      <ShoppingIcon
        width={28}
        isActive={activeModule === "cart"}
        onClick={() => handleModuleClick("cart")}
      />
      <PlusIcon
        width={28}
        isActive={activeModule === "add-product"}
        onClick={() => handleModuleClick("add-product")}
      />
      <ReminderIcon
        width={28}
        isActive={activeModule === "reminder"}
        onClick={() => handleModuleClick("reminder")}
      />
      <UserIcon
        width={28}
        isActive={activeModule === "profile"}
        onClick={() => handleModuleClick("profile")}
      />
    </div>
  );
};

export default BottomNavigation;
