import {
  HomeIcon,
  PlusIcon,
  ReminderIcon,
  ShoppingIcon,
  UserIcon,
} from "@/common";
import { useGlobalContext } from "@/context/global-context";
import React from "react";

const BottomNavigation = () => {
  const { activeModule, setActiveModule } = useGlobalContext();
  return (
    <div className="flex justify-between fixed bottom-0 w-full px-10 py-3 ">
      <HomeIcon
        width={28}
        isActive={activeModule === "home"}
        onClick={() => setActiveModule("home")}
      />
      <ShoppingIcon
        width={28}
        isActive={activeModule === "cart"}
        onClick={() => setActiveModule("cart")}
      />
      <PlusIcon
        width={28}
        isActive={activeModule === "add-product"}
        onClick={() => setActiveModule("add-product")}
      />
      <ReminderIcon
        width={28}
        isActive={activeModule === "reminder"}
        onClick={() => setActiveModule("reminder")}
      />
      <UserIcon
        width={28}
        isActive={activeModule === "profile"}
        onClick={() => setActiveModule("profile")}
      />
    </div>
  );
};

export default BottomNavigation;
