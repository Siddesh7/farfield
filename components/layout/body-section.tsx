import { useGlobalContext } from '@/context/global-context';
import { CartPage } from '@/modules/cart';
import { HomePage } from '@/modules/home';
import React, { useState } from 'react';
import { ProfilePage } from '@/modules/profile';
import { useGetProducts } from '@/query';

const BodySection = () => {
    const { activeModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('All')

    // Call all the queries here to maintain consistency throughout the app
    const { data: allProducts, isLoading: loadingProducts, error, refetch: refetchAllProducts } = useGetProducts(page, limit, category);

    return (
        <div className="pb-8 mb-8 flex flex-1 flex-col">
            {activeModule === 'home' && <HomePage isLoading={loadingProducts} products={allProducts} setCategory={setCategory} />}
            {activeModule === 'cart' && <CartPage />}
            {activeModule === 'profile' && <ProfilePage />}
        </div>
    );
};

export default BodySection;