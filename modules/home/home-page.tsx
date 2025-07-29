import React, { FC } from "react";
import { BoxContainer } from "@/components/common";
import { useGlobalContext } from "@/context/global-context";
import { HomeComponent } from "./components/home-component";
import { ProductComponent } from "./components/product-component";
import { Product } from "@/lib/types/product";

const ProductTypes = [
    "All",
    "Technology",
    "Art",
    "Books",
    "Music",
    "Miscellaneous",
];

type HomePageProps = {
    isLoading: boolean;
    products: Product[];
    setCategory: (category: string) => void;
};

const HomePage: FC<HomePageProps> = ({
    isLoading,
    products,
    setCategory
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
                    ProductTypes={ProductTypes}
                    isLoading={isLoading}
                />
            )}
        </BoxContainer>
    );
};

export default HomePage;
