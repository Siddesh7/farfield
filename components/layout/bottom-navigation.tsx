import {
  HistoryIcon,
  HomeIcon,
  PlusIcon,
  ShoppingIcon,
  UserIcon,
} from "@/components/icons";
import { useGlobalContext } from "@/context/global-context";
import { ModulesType } from "@/lib/types/global";
import { useCallback, useEffect, useState } from "react";
import { sdk } from '@farcaster/frame-sdk';

const BottomNavigation = () => {
  const { activeModule, setActiveModule } = useGlobalContext();

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
      className="flex justify-between fixed bottom-0 w-full px-10 py-3 z-10 bg-white">
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
      <HistoryIcon
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
