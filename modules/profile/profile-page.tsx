import { usePrivy } from "@privy-io/react-auth";
import {
  BoxContainer,
  ProfileCard,
  WalletSyncStatus,
} from "@/components/common";
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-spinner";
import { Skeleton, Button } from "@/components/ui";
import { useUserProfile } from "@/query";
import { FC, useState } from "react";
import { Package, WalletMinimal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/lib/types/product";
import { PurchaseHistoryItem } from "@/query";
import ProfileComponent from "./components/profile-component";
import ListedProducts from "./components/listed-products";
import BoughtProducts from "./components/bought-products";
import { toast } from "sonner";
import { useSendTransaction, useAccount, useReadContract } from "wagmi";
import { encodeFunctionData } from "viem";
import {
  FARFIELD_ABI,
  FARFIELD_CONTRACT_ADDRESS,
  usdcUtils,
} from "@/lib/blockchain";

type ProfilePageProps = {
  listedProducts: Product[] | undefined;
  purchasedproducts: PurchaseHistoryItem[] | undefined;
  loading: boolean;
};

const ProfilePage: FC<ProfilePageProps> = ({
  listedProducts,
  purchasedproducts,
  loading,
}) => {
  const { ready, authenticated, user } = usePrivy();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchUserProfile,
  } = useUserProfile();
  const [isClaimingAmount, setIsClaimingAmount] = useState(false);

  // Get wallet address from wagmi
  const { address } = useAccount();

  // Get seller info directly from contract
  const {
    data: sellerInfo,
    isLoading: sellerInfoLoading,
    refetch: refetchSellerInfo,
  } = useReadContract({
    address: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
    abi: FARFIELD_ABI,
    functionName: "sellerInfos",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { sendTransactionAsync } = useSendTransaction();

  const handleClaimAmount = async () => {
    if (isClaimingAmount) return;

    setIsClaimingAmount(true);

    try {
      const data = encodeFunctionData({
        abi: FARFIELD_ABI,
        functionName: "withdrawEarnings",
        args: [],
      });

      toast.loading("Processing withdrawal transaction...", {
        id: "claim-loading",
      });

      const hash = await sendTransactionAsync({
        to: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        data,
        value: BigInt(0),
      });

      console.log("Transaction Hash:", hash);

      // Refetch both user profile and seller info to update amounts
      await Promise.all([refetchUserProfile(), refetchSellerInfo()]);

      toast.success("Withdrawal transaction submitted successfully!", {
        id: "claim-loading",
        description: `Transaction hash: ${hash?.slice(0, 10)}...`,
      });
    } catch (error: any) {
      console.error("Claim amount error:", error);

      let errorMessage = "Failed to process withdrawal. Please try again.";

      if (error?.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction fees.";
      } else if (error?.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error?.message) {
        // Use the actual error message if available
        errorMessage =
          error.message.length > 100
            ? error.message.slice(0, 100) + "..."
            : error.message;
      }

      toast.error(errorMessage, {
        id: "claim-loading",
        duration: 5000,
      });
    } finally {
      setIsClaimingAmount(false);
    }
  };

  return (
    <>
      <LoadingState loading={!ready} text="Loading Privy...">
        <BoxContainer className=" pt-7 flex flex-col items-center">
          {user && (
            <div className="flex flex-col gap-8.5 w-full">
              <div className="flex flex-col gap-4.5">
                <ProfileComponent user={user} />
                <div className="flex gap-3 justify-center">
                  <div className="flex gap-3 p-2.5 justify-center bg-fade-background rounded-lg items-center">
                    <div className="flex flex-col">
                      <h3>
                        {(listedProducts?.length || 0) > 0
                          ? "Available to claim"
                          : "Start selling and earn"}
                      </h3>
                      <span className="text-[#02B151] font-inter">
                        {sellerInfoLoading ? (
                          <Skeleton className="h-4 w-16" />
                        ) : (
                          `+${
                            sellerInfo
                              ? usdcUtils.formatDisplay(sellerInfo[1])
                              : "$0.00"
                          }`
                        )}
                      </span>
                      {sellerInfo && sellerInfo[0] > BigInt(0) && (
                        <span className="text-xs text-gray-500">
                          Total earned: {usdcUtils.formatDisplay(sellerInfo[0])}
                        </span>
                      )}
                    </div>

                    <Button
                      disabled={
                        (listedProducts?.length || 0) === 0 ||
                        isClaimingAmount ||
                        (sellerInfo?.[1] || BigInt(0)) === BigInt(0)
                      }
                      onClick={handleClaimAmount}
                      className="min-w-[120px]"
                    >
                      {isClaimingAmount ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Claiming...
                        </>
                      ) : (
                        "Claim Amount"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <>
                {loading || !listedProducts || !purchasedproducts ? (
                  <div className="min-h-screen flex flex-col gap-2 pt-22 items-center justify-center">
                    <LoadingSpinner color="secondary" />
                    <p className="p-0 text-fade">Fetching Products...</p>
                  </div>
                ) : (
                  <div>
                    <Tabs defaultValue="boughtProducts">
                      <TabsList className="font-awesome w-full border-b-1 border-[#0000001F]">
                        <div className="px-4.5 flex justify-between w-full">
                          <TabsTrigger
                            value="boughtProducts"
                            className="text-lg"
                          >
                            Products Bought
                          </TabsTrigger>
                          <TabsTrigger
                            value="listedProducts"
                            className="text-lg"
                          >
                            Listed Product
                          </TabsTrigger>
                        </div>
                      </TabsList>
                      <TabsContent value="listedProducts">
                        <ListedProducts listedProducts={listedProducts} />
                      </TabsContent>
                      <TabsContent value="boughtProducts">
                        <BoughtProducts purchasedproducts={purchasedproducts} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </>
            </div>
          )}
        </BoxContainer>
      </LoadingState>
    </>
  );
};

export { ProfilePage };
