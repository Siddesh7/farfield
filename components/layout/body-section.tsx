import { useGlobalContext } from '@/context/global-context';
import { CartPage } from '@/modules/cart';
import { HomePage } from '@/modules/home';
import React, { useState, useCallback, useEffect } from 'react';
import { ProfilePage } from '@/modules/profile';
import { NotificationsPage } from '@/modules/notifications';
import { useGetMyProducts, useGetProducts, useGetPurchasedProducts } from '@/query';
import { useGetProductById } from '@/query/use-get-product-by-id';
import { CreateProduct } from '@/modules/createProduct';
import { Product } from '@/lib/types/product';

const BodySection = () => {
    const { activeModule, setSelectedProduct, setActiveModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('All');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [productIdFromUrl, setProductIdFromUrl] = useState<string | null>(null);

    // Call the regular products query
    const { data: currentPageProducts, isLoading: loadingProducts, error, refetch: refetchAllProducts } = useGetProducts(page, limit, category);
    
    // Fetch product by ID if URL parameter is present
    const { data: sharedProduct, isLoading: loadingSharedProduct, error: sharedProductError } = useGetProductById(productIdFromUrl || '');

    // Check for pId URL parameter on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const pId = urlParams.get('pId');
            if (pId) {
                setProductIdFromUrl(pId);
            }
        }
    }, []);

    // Set selected product when shared product is loaded
    useEffect(() => {
        if (sharedProduct && !loadingSharedProduct && !sharedProductError) {
            setSelectedProduct(sharedProduct);
            setActiveModule('home'); // Ensure we're on the home module to show the product
        } else if (sharedProductError && productIdFromUrl) {
            // If there's an error loading the shared product, clear the URL parameter state
            // This will allow the user to continue using the app normally
            console.error('Failed to load shared product:', sharedProductError);
            setProductIdFromUrl(null);
        }
    }, [sharedProduct, loadingSharedProduct, sharedProductError, setSelectedProduct, setActiveModule, productIdFromUrl]);

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

    const loadingModules = loadingPurchasedProducts || loadingMyProducts || (loadingProducts && page === 1) || Boolean(productIdFromUrl && loadingSharedProduct);

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