import React, { FC } from "react";
import { BoxContainer } from "@/components/common";
import { useGlobalContext } from "@/context/global-context";
import { HomeComponent } from "./components/home-component";
import { ProductComponent } from "./components/product-component";
import { Product } from "@/lib/types/product";
import { PRODUCT_TYPES } from "@/constants";

type HomePageProps = {
    isLoading: boolean;
    products: Product[];
    setCategory: (category: string) => void;
    loadNextPage: () => void;
    loadingMore: boolean;
    // Search props
    onSearch: (query: string) => void;
    onClearSearch: () => void;
    isSearching: boolean;
    searchQuery: string;
    searchResults: Product[];
    searchLoading: boolean;
};

const HomePage: FC<HomePageProps> = ({
    isLoading,
    products,
    setCategory,
    loadNextPage,
    loadingMore,
    onSearch,
    onClearSearch,
    isSearching,
    searchQuery,
    searchResults,
    searchLoading,
}) => {
    const { selectedProduct } = useGlobalContext();

    return (
        <BoxContainer className="flex flex-col">

            {selectedProduct ? (
                <ProductComponent product={selectedProduct} />
            ) : (
                <HomeComponent
                    products={products}
                    setCategory={setCategory}
                    ProductTypes={PRODUCT_TYPES}
                    isLoading={isLoading}
                    loadNextPage={loadNextPage}
                    loadingMore={loadingMore}
                    onSearch={onSearch}
                    onClearSearch={onClearSearch}
                    isSearching={isSearching}
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    searchLoading={searchLoading}
                />
            )}
        </BoxContainer>
    );
};

export default HomePage;
