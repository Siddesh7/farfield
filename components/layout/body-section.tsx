import { useGlobalContext } from '@/context/global-context';
import { CartPage } from '@/modules/cart';
import { HomePage } from '@/modules/home';
import React, { useState } from 'react';
import { ProfilePage } from '@/modules/profile';
import { useGetMyProducts, useGetProducts, useGetPurchasedProducts } from '@/query';
import { CreateProduct } from '@/modules/createProduct';

const BodySection = () => {
    const { activeModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('All')

    // Call all the queries here to maintain consistency throughout the app
    const { data: allProducts, isLoading: loadingProducts, error, refetch: refetchAllProducts } = useGetProducts(page, limit, category);

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

    const loadingModules = loadingPurchasedProducts || loadingMyProducts || loadingProducts;

    return (
        <div className="pb-8 mb-8 flex flex-1 flex-col">
            {activeModule === 'home' && <HomePage isLoading={loadingModules} products={allProducts} setCategory={setCategory} />}
            {activeModule === 'cart' && <CartPage />}
            {activeModule === 'add-product' && <CreateProduct refetchAllProducts={refetchAllProducts} />}
            {activeModule === 'profile' && <ProfilePage
                listedProducts={myProducts}
                purchasedproducts={purchasedProducts}
                loading={loadingModules}
            />}
        </div>
    );
};

export default BodySection;