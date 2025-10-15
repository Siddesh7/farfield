// 1. React imports
import React, { useState, useCallback } from "react";

// 2. Third-party imports
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Check } from "lucide-react";

// 3. Internal imports (absolute paths)
import { BoxContainer } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WalletIcon, FileIcon, SwapIcon } from "@/components/icons";
import { useGlobalContext } from "@/context/global-context";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";
import { usePurchaseConfirm } from "@/query";
import {
  usdcUtils,
  transactionBatcher,
  sendCallsUtils,
  CHAIN_ID,
} from "@/lib/blockchain";
import { wagmiConfig } from "@/config";

// 4. Relative imports
import { CartListItem } from "./components/cart-list-item";

const CartPage = () => {
  // Hooks at the top
  const { cart, removeFromCart, setActiveModule } = useGlobalContext();
  const { address, isConnected } = useAccount();
  const { post } = useAuthenticatedAPI();
  const purchaseConfirmMutation = usePurchaseConfirm();

  const [loading, setLoading] = useState(false);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Step states: 'pending', 'active', 'completed', 'error'
  const [stepStates, setStepStates] = useState<
    ("pending" | "active" | "completed" | "error")[]
  >([
    "pending", // Step 1: Processing Payment
    "pending", // Step 2: Finalizing Purchase
  ]);

  const checkoutSteps = [
    { icon: FileIcon, text: "Processing Payment" },
    { icon: SwapIcon, text: "Finalizing Purchase" },
  ];

  // Event handlers
  const updateStepState = useCallback(
    (
      stepIndex: number,
      state: "pending" | "active" | "completed" | "error"
    ) => {
      setStepStates((prev) =>
        prev.map((s, i) => (i === stepIndex ? state : s))
      );
    },
    []
  );

  const getShortErrorMessage = useCallback((error: string): string => {
    const words = error.split(" ");
    if (words.length <= 20) return error;
    return words.slice(0, 20).join(" ") + "...";
  }, []);

  const initiateCheckout = useCallback(async () => {
    setCheckoutError(null);
    setLoading(true);
    setCheckoutStarted(true);
    setCurrentStep(0);

    // Reset all steps to pending
    setStepStates(["pending", "pending"]);

    try {
      if (!isConnected || !address) {
        throw new Error(
          "Please connect your wallet to proceed with the purchase."
        );
      }

      // Initiate purchase first (silent step)
      const res = await post("/api/purchase/initiate", {
        items: cart.map((product) => ({ productId: product.id })),
        buyerWallet: address,
      });

      const data = res.data;
      if (!data || !data.transactions || !data.purchaseId) {
        throw new Error("Failed to initiate purchase. Please try again.");
      }

      // Step 1: Process payment (execute batched transaction)
      setCurrentStep(0);
      updateStepState(0, "active");

      // Convert transactions to sendCalls format
      const calls = transactionBatcher.generateCallsFromTransactions(
        data.transactions
      );

      // Execute batched calls
      const result = await sendCallsUtils.executeBatchedCalls(
        wagmiConfig,
        calls,
        CHAIN_ID
      );

      // Get the batch ID from sendCalls result
      const batchId = result.id;

      updateStepState(0, "completed");

      // Step 2: Finalize purchase (wait for confirmation)
      setCurrentStep(1);
      updateStepState(1, "active");

      // Wait for batch to complete and get transaction hashes
      const batchResult = await sendCallsUtils.waitForBatchCompletion(
        wagmiConfig,
        batchId
      );

      // Get the purchase transaction hash (should be the last one in the batch)
      const transactionHashes = batchResult.transactionHashes;
      const purchaseTransactionHash =
        transactionHashes[transactionHashes.length - 1];

      if (!purchaseTransactionHash) {
        throw new Error("Purchase transaction hash not found in batch");
      }

      const confirmResult = await purchaseConfirmMutation.mutateAsync({
        purchaseId: data.purchaseId,
        transactionHash: purchaseTransactionHash, // Using actual transaction hash
      });

      updateStepState(1, "completed");

      // Success handling
      toast.success("Purchase completed successfully!");

      // Clear cart
      cart.forEach((product) => removeFromCart(product.id));

      // Wait a moment then redirect to profile
      setTimeout(() => {
        setActiveModule("profile");
      }, 1500);
    } catch (err: any) {
      const errorMessage = getShortErrorMessage(
        err?.message ||
          (typeof err === "string" ? err : "Purchase failed. Please try again.")
      );

      setCheckoutError(errorMessage);

      const activeStepIndex = stepStates.findIndex(
        (state) => state === "active"
      );
      if (activeStepIndex !== -1) {
        updateStepState(activeStepIndex, "error");
      } else {
        updateStepState(currentStep, "error");
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    isConnected,
    address,
    post,
    cart,
    updateStepState,
    purchaseConfirmMutation,
    removeFromCart,
    setActiveModule,
    getShortErrorMessage,
  ]);

  // Main render
  return (
    <BoxContainer className="relative flex flex-1 flex-col pt-22 px-5.5">
      <div className="pt-4.5 flex flex-col flex-1 gap-4 pb-28">
        {cart.length !== 0 && (
          <p className="font-awesome text-2xl">Your Cart</p>
        )}
        <ScrollArea className="rounded-md flex-1 min-h-0 overflow-y-auto pr-3">
          <div className="flex flex-col pt-4">
            {cart.length === 0 ? (
              <div className="flex flex-col gap-2 items-center justify-center">
                <h3 className="text-center font-awesome text-2xl">
                  Your Cart is Empty
                </h3>
                <p className="text-[#00000052] text-sm">
                  Explore the products and add to cart
                </p>
                <Button
                  variant="outline"
                  className="bg-white"
                  size="lg"
                  onClick={() => setActiveModule("home")}
                >
                  Explore Products
                </Button>
              </div>
            ) : (
              cart.map((product) => (
                <CartListItem key={product.id} product={product} />
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {cart.length > 0 && (
        <div className="fixed left-0 bottom-12 w-full backdrop-blur-3xl bg-gradient-to-t from-gray-300/95 to-transparent flex flex-col gap-4 p-5.5 z-10 pb-8">
          <div className="flex w-full justify-between items-center">
            <p className="text-lg font-semibold">Total:</p>
            <p className="text-xl font-normal">
              {(() => {
                const total = cart.reduce((sum, p) => sum + (p.price || 0), 0);
                return total === 0 ? "Free" : `$${total.toFixed(2)}`;
              })()}
            </p>
          </div>

          {/* Checkout Steps */}
          {checkoutStarted && (
            <div className="flex flex-col py-2">
              {checkoutSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isLastStep = index === checkoutSteps.length - 1;

                return (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 relative z-10">
                          <IconComponent
                            width={20}
                            color={
                              stepStates[index] === "completed"
                                ? "#16a34a"
                                : stepStates[index] === "active"
                                ? "#2563eb"
                                : stepStates[index] === "error"
                                ? "#dc2626"
                                : "#9ca3af"
                            }
                          />
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            stepStates[index] === "completed"
                              ? "text-green-600"
                              : stepStates[index] === "active"
                              ? "text-blue-600"
                              : stepStates[index] === "error"
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {step.text}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {stepStates[index] === "completed" ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        ) : stepStates[index] === "active" ? (
                          <LoadingSpinner
                            size="sm"
                            color="primary"
                            className="w-5 h-5"
                          />
                        ) : stepStates[index] === "error" ? (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">✕</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-300" />
                        )}
                      </div>
                    </div>

                    {/* Vertical connector line */}
                    {!isLastStep && (
                      <div className="absolute left-2.5 top-8 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button size="lg" disabled={loading} onClick={initiateCheckout}>
            {loading ? (
              <span className="flex items-center gap-2">
                Buying... <LoadingSpinner size="sm" />
              </span>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </div>
      )}
    </BoxContainer>
  );
};

export { CartPage };
