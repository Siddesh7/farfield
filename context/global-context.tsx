import { ModulesType } from "@/lib/types/global";
import { Product } from "@/lib/types/product";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface GlobalContextType {
  selectedProduct: Product | null;
  activeModule: ModulesType;
  setActiveModule: (activeModule: ModulesType) => void;
  setSelectedProduct: (selectedProduct: Product | null) => void;
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;

    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }, [isClient]);

  // Sync cart to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart, isClient]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      // Prevent duplicates by _id
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((p) => p.id !== productId));
  };

  const value = {
    activeModule,
    selectedProduct,
    setActiveModule,
    setSelectedProduct,
    cart,
    addToCart,
    removeFromCart,
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
