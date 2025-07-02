import { useGlobalContext } from "@/context/global-context";
import { CartPage } from "@/modules/cart";
import { CreateProduct } from "@/modules/createProduct";
import { HomePage } from "@/modules/home";
import {
    useGetMyProducts,
    useGetProducts,
    useGetPurchasedProducts,
} from "@/query";
import React, { useState } from "react";
import { LoadingSpinner } from "../ui";
import { ProfilePage } from "@/modules/profile";
import { HistoryPage } from "@/modules/history";

const BodySection = () => {
    const { activeModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>("Technology");

    // Call all the queries here to maintain consistency throughout the app
    const {
        data: allProducts,
        isLoading: loadingProducts,
        error,
        refetch: refetchAllProducts,
    } = useGetProducts(page, limit);
    console.log("allProducts", allProducts);

    // Users listed and bought products details
    const {
        data: myProducts,
        error: myProductsError,
        isLoading: loadingMyProducts,
    } = useGetMyProducts({ page: 1, limit: 10 });
    const {
        data: purchasedProducts,
        error: purchasedProductsError,
        isLoading: loadingPurchasedProducts,
    } = useGetPurchasedProducts({ page: 1, limit: 10 });

    const loadingUserProducts = loadingPurchasedProducts || loadingMyProducts;

    if (loadingProducts) {
        return (
            <div className="min-h-screen flex flex-col gap-2 pt-22 items-center justify-center">
                <LoadingSpinner color="secondary" />
                <p className="p-0 text-fade">Fetching Products...</p>
            </div>
        );
    }

    return (
        <div className="pb-8 mb-8 flex flex-1 flex-col">
            {activeModule === "home" && (
                <HomePage products={allProducts} setCategory={setCategory} />
            )}
            {activeModule === "cart" && <CartPage />}
            {activeModule === "add-product" && (
                <CreateProduct refetchAllProducts={refetchAllProducts} />
            )}
            {activeModule === "history" && <HistoryPage />}
            {activeModule === "profile" && (
                <ProfilePage
                    listedProducts={myProducts}
                    purchasedproducts={purchasedProducts}
                    loading={loadingUserProducts}
                />
            )}
        </div>
    );
};

export default BodySection;
