import {
  HistoryIcon,
  HomeIcon,
  NotificationIcon,
  PlusIcon,
  ShoppingIcon,
  UserIcon,
} from "@/components/icons";
import { useGlobalContext } from "@/context/global-context";
import { ModulesType } from "@/lib/types/global";
import { useCallback, useEffect, useState } from "react";
import { sdk } from '@farcaster/frame-sdk';

const BottomNavigation = () => {
  const { activeModule, setActiveModule, selectedProduct, setSelectedProduct, cart } = useGlobalContext();

  const handleModuleClick = useCallback(
    (module: ModulesType) => {
      setActiveModule(module);
    },
    [setActiveModule]
  );

  const [insets, setInsets] = useState({ top: 0, bottom: 15, left: 0, right: 0 });

  useEffect(() => {
    (async () => {
      const { client } = await sdk.context;
      if (client.safeAreaInsets) {
        setInsets(client.safeAreaInsets);
      }
    })();
  }, []);

  return (
    <div
      style={{
        paddingBottom: insets.bottom,
        background: '#fff',
      }}
      className="flex justify-between fixed bottom-0 w-full px-10 py-3 z-10">
      <HomeIcon
        width={28}
        isActive={activeModule === "home"}
        onClick={() => {
          if(selectedProduct){
            setSelectedProduct(null)
          }
          handleModuleClick("home")
        }}
      />
      <div className="relative">
        <ShoppingIcon
          width={28}
          isActive={activeModule === "cart"}
          onClick={() => handleModuleClick("cart")}
        />
        {cart.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {cart.length > 9 ? '9+' : cart.length}
          </div>
        )}
      </div>
      <PlusIcon
        width={28}
        isActive={activeModule === "add-product"}
        onClick={() => handleModuleClick("add-product")}
      />
      <NotificationIcon
        width={22}
        isActive={activeModule === "notifications"}
        onClick={() => handleModuleClick("notifications")}
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
