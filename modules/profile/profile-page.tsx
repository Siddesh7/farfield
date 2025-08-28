import { usePrivy } from "@privy-io/react-auth";
import { BoxContainer } from "@/components/common";
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-spinner";
import { Skeleton, Button } from "@/components/ui";
import { useUserProfile } from "@/query";
import { FC, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/lib/types/product";
import { PurchaseHistoryItem } from "@/query";
import ProfileComponent from "./components/profile-component";
import ListedProducts from "./components/listed-products";
import BoughtProducts from "./components/bought-products";
import { toast } from "sonner";
import {
  useSendTransaction,
  useAccount,
  useReadContracts,
  useSwitchChain,
  useSwitchAccount,
} from "wagmi";
import { encodeFunctionData } from "viem";
import {
  CHAIN_ID,
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
  const { ready, user, connectWallet } = usePrivy();
  const {
    data: profile,

    refetch: refetchUserProfile,
  } = useUserProfile();
  const [isClaimingAmount, setIsClaimingAmount] = useState(false);

  // Get wallet address(es) from wagmi
  const { address, addresses } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  // Collect target addresses: connected wallet, profile owner, and all linked wallets
  const targetAddresses = Array.from(
    new Set(
      [
        address,
        profile?.farcaster?.ownerAddress as `0x${string}` | undefined,
        ...(profile?.wallets?.map((w) => w.address as `0x${string}`) || []),
      ].filter(Boolean) as `0x${string}`[]
    )
  ) as `0x${string}`[];

  const contracts = useMemo(
    () =>
      targetAddresses.map((addr) => ({
        address: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        abi: FARFIELD_ABI,
        functionName: "sellerInfos" as const,
        args: [addr] as const,
      })),
    [targetAddresses]
  );

  const {
    data: sellerInfos,
    isLoading: sellerInfoLoading,
    refetch: refetchSellerInfos,
  } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const parsedSellerInfos = (sellerInfos || [])
    .map((r) => r?.result as unknown as [bigint, bigint] | undefined)
    .filter(Boolean) as [bigint, bigint][];

  const totalEarnedAll = parsedSellerInfos.reduce(
    (sum, info) => sum + (info?.[0] || BigInt(0)),
    BigInt(0)
  );
  const availableAll = parsedSellerInfos.reduce(
    (sum, info) => sum + (info?.[1] || BigInt(0)),
    BigInt(0)
  );

  // Pair each target address to its read result (earned, available)
  const addressInfoPairs = useMemo(
    () =>
      targetAddresses.map((addr, idx) => ({
        address: addr,
        info:
          (sellerInfos?.[idx]?.result as unknown as
            | [bigint, bigint]
            | undefined) || undefined,
      })),
    [targetAddresses, sellerInfos]
  );

  const addressWithAvailable = addressInfoPairs.find(
    (p) => (p.info?.[1] || BigInt(0)) > BigInt(0)
  )?.address;

  const claimAddress = addressWithAvailable || address;

  const { sendTransactionAsync } = useSendTransaction();

  const handleClaimAmount = async () => {
    if (isClaimingAmount) return;

    setIsClaimingAmount(true);

    try {
      // If available on a different address, prompt to connect that wallet (do not send tx)
      if (availableAll === BigInt(0)) {
        toast.error("No funds available to claim across your addresses.");
        return;
      }

      // If the claim address is not among connected wagmi addresses, prompt connect and exit
      const isClaimAddressConnected =
        !!claimAddress &&
        (addresses || []).some(
          (a) => a?.toLowerCase() === (claimAddress as string).toLowerCase()
        );
      if (!isClaimAddressConnected) {
        connectWallet({ suggestedAddress: claimAddress });
        return;
      }

      const data = encodeFunctionData({
        abi: FARFIELD_ABI,
        functionName: "withdrawEarnings",
        args: [],
      });

      toast.loading("Processing withdrawal transaction...", {
        id: "claim-loading",
      });
      await switchChainAsync({
        chainId: CHAIN_ID,
      });
      const hash = await sendTransactionAsync({
        account: claimAddress as `0x${string}`,
        to: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        data,
        value: BigInt(0),
        chainId: CHAIN_ID,
      });

      console.log("Transaction Hash:", hash);

      // Refetch both user profile and seller info to update amounts
      await Promise.all([refetchUserProfile(), refetchSellerInfos()]);

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
                          `+$${usdcUtils.formatDisplay(availableAll)}`
                        )}
                      </span>
                      {totalEarnedAll > BigInt(0) && (
                        <span className="text-xs text-gray-500">
                          Total earned:{" "}
                          {usdcUtils.formatDisplay(totalEarnedAll)}
                        </span>
                      )}
                    </div>

                    <Button
                      disabled={
                        isClaimingAmount ||
                        sellerInfoLoading ||
                        availableAll === BigInt(0)
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
