import { usePrivy } from "@privy-io/react-auth";
import {
  BoxContainer,
  ProfileCard,
  WalletSyncStatus,
} from "@/components/common";
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-spinner";
import { Skeleton, Button } from "@/components/ui";
import { useUserProfile } from "@/query";
import { FC } from "react";
import { Package, WalletMinimal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/lib/types/product";
import { PurchaseHistoryItem } from "@/query";
import ProfileComponent from "./components/profile-component";
import ListedProducts from "./components/listed-products";
import BoughtProducts from "./components/bought-products";
import { toast } from "sonner";

type ProfilePageProps = {
  listedProducts: Product[] | undefined;
  purchasedproducts: PurchaseHistoryItem[] | undefined;
  loading: boolean
}

const ProfilePage: FC<ProfilePageProps> = ({ listedProducts, purchasedproducts, loading }) => {
  const { ready, authenticated, user } = usePrivy();
  const { data: profile, isLoading: profileLoading, error: profileError } = useUserProfile();

  const handleClaimAmount = () => {
    toast.info("Claim feature will be available in the next version!");
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
                  <div className="flex gap-3 p-2.5 justify-center bg-fade-background rounded-lg">

                    <div className="flex flex-col">
                      <h3>{(listedProducts?.length || 0) > 0 ? 'Amount earned' : 'Start selling and earn'}</h3>
                      <span className="text-[#02B151] font-inter">
                        {profileLoading ? (
                          <Skeleton className="h-4 w-16" />
                        ) : (
                          `+$${profile?.totalEarned?.toFixed(2) || '0.00'}`
                        )}
                      </span>
                    </div>

                    <Button 
                      disabled={(listedProducts?.length || 0) === 0}
                      onClick={handleClaimAmount}
                    >
                      Claim Amount
                    </Button>
                  </div>
                </div>


              </div>
              <>
                {loading || !listedProducts || !purchasedproducts ? (
                  <div className='min-h-screen flex flex-col gap-2 pt-22 items-center justify-center'>
                    <LoadingSpinner color="secondary" />
                    <p className='p-0 text-fade'>Fetching Products...</p>
                  </div>
                ) : (
                  <div>
                    <Tabs defaultValue="boughtProducts">
                      <TabsList className="font-awesome w-full border-b-1 border-[#0000001F]">
                        <div className="px-4.5 flex justify-between w-full">
                          <TabsTrigger value="boughtProducts" className="text-lg">Products Bought</TabsTrigger>
                          <TabsTrigger value="listedProducts" className="text-lg">Listed Product</TabsTrigger>
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
