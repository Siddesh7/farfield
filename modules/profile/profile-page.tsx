import { usePrivy } from "@privy-io/react-auth";
import {
  BoxContainer,
  ProfileCard,
  WalletSyncStatus,
} from "@/components/common";
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-spinner";
import { useUserProfileApi } from "@/lib/hooks/use-api-state";
import { FC, useEffect, useRef } from "react";
import { Package, WalletMinimal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListedProducts from "./components/listed-products";
import BoughtProducts from "./components/bought-products";
import ProfileComponent from "./components/profile-component";
import { Product } from "@/lib/types/product";
import { PaginatedResponse } from "@/lib";
import { PurchaseHistoryResponse } from "@/query";

type ProfilePageProps = {
  listedProducts: Product[] | undefined;
  purchasedproducts: PurchaseHistoryResponse | undefined;
  loading: boolean
}


const ProfilePage: FC<ProfilePageProps> = ({ listedProducts, purchasedproducts, loading }) => {
  const { ready, authenticated, user } = usePrivy();

  const { profile, profileLoading, profileError, fetchProfile } =
    useUserProfileApi();

  // Track if we've already fetched the profile to prevent infinite loops
  const hasFetchedRef = useRef(false);

  // Fetch profile data when component mounts
  useEffect(() => {
    if (authenticated && ready && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchProfile();
    }
  }, [authenticated, ready]); // Removed fetchProfile from dependencies

  // Reset the fetch flag when user logs out
  useEffect(() => {
    if (!authenticated) {
      hasFetchedRef.current = false;
    }
  }, [authenticated]);

  return (
    <>
      <LoadingState loading={!ready} text="Loading Privy...">
        <BoxContainer className=" pt-7 flex flex-col items-center">
          {user && (
            <div className="flex flex-col gap-8.5 w-full">
              <div className="flex flex-col gap-4.5">
                <ProfileComponent user={user} />
                <div className="flex gap-3 justify-center">
                  <div className="px-7 py-3 bg-fade-background rounded-lg flex gap-2 items-center">
                    <WalletMinimal size={16} />
                    <span className="text-[#02B151] font-inter">+$1,234</span>
                  </div>
                  <div className="px-7 py-3 bg-fade-background rounded-lg flex gap-2 items-center ">
                    <Package size={16} />
                    <span className="font-inter">35+ Created</span>
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
                    <Tabs defaultValue="listedProducts">
                      <TabsList className="font-awesome w-full border-b-1 border-[#0000001F]">
                        <div className="px-5.5 flex justify-between w-full">
                          <TabsTrigger value="listedProducts" className="text-2xl">Listed Product</TabsTrigger>
                          <TabsTrigger value="boughtProducts" className="text-2xl">Products Bought</TabsTrigger>
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
