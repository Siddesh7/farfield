import { useGlobalContext } from '@/context/global-context';
import { CartPage } from '@/modules/cart';
import { HomePage } from '@/modules/home';
import React, { useState, useCallback } from 'react';
import { ProfilePage } from '@/modules/profile';
import { NotificationsPage } from '@/modules/notifications';
import { useGetMyProducts, useGetProducts, useGetPurchasedProducts } from '@/query';
import { CreateProduct } from '@/modules/createProduct';
import { Product } from '@/lib/types/product';

const BodySection = () => {
    const { activeModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('All');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loadingMore, setLoadingMore] = useState(false);

    // Call the regular products query
    const { data: currentPageProducts, isLoading: loadingProducts, error, refetch: refetchAllProducts } = useGetProducts(page, limit, category);

    // When we get new products, add them to our accumulated list
    React.useEffect(() => {
        if (currentPageProducts) {
            if (page === 1) {
                setAllProducts(currentPageProducts);
            } else if (currentPageProducts.length > 0) {
                // For other pages, only add if there are products
                setAllProducts(prev => [...prev, ...currentPageProducts]);
            }
            setLoadingMore(false);
        } else if (!loadingProducts && page > 1) {
            setLoadingMore(false);
        }
    }, [currentPageProducts, page, loadingProducts, category]);

    // Reset when category changes
    React.useEffect(() => {
        setPage(1);
        setLoadingMore(false);
        // Don't clear allProducts here - let the products effect handle it
    }, [category]);

    // Function to load next page
    const loadNextPage = useCallback(() => {
        if (!loadingMore && !loadingProducts && currentPageProducts && currentPageProducts.length === limit) {
            setLoadingMore(true);
            setPage(prev => prev + 1);
        } else {
            console.log('Not loading next page - conditions not met');
        }
    }, [loadingMore, loadingProducts, currentPageProducts, limit]);

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

    const loadingModules = loadingPurchasedProducts || loadingMyProducts || (loadingProducts && page === 1);

    return (
        <div className="pb-8 mb-8 flex flex-1 flex-col">
            {activeModule === 'home' && (
                <HomePage 
                    isLoading={loadingModules} 
                    products={allProducts} 
                    setCategory={setCategory}
                    loadNextPage={loadNextPage}
                    loadingMore={loadingMore || (loadingProducts && page > 1)}
                />
            )}
            {activeModule === 'cart' && <CartPage />}
            {activeModule === 'add-product' && <CreateProduct refetchAllProducts={refetchAllProducts} />}
            {activeModule === 'notifications' && <NotificationsPage />}
            {activeModule === 'profile' && <ProfilePage
                listedProducts={myProducts}
                purchasedproducts={purchasedProducts}
                loading={loadingModules}
            />}
        </div>
    );
};

export default BodySection;