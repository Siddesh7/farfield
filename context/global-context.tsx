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

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      // Prevent duplicates by _id
      if (prev.some((p) => p._id === product._id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((p) => p._id !== productId));
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
