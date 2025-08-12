import { useGlobalContext } from '@/context/global-context';
import { CartPage } from '@/modules/cart';
import { CreateProduct } from '@/modules/createProduct';
import { HomePage } from '@/modules/home';
import { useGetProducts } from '@/query';
import React, { useState } from 'react';
import { ProfilePage } from '@/modules/profile';
import NotificationPage from '@/modules/notifications/notification-page';

const BodySection = () => {

    const { activeModule } = useGlobalContext();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('Technology')

    // Call all the queries here to maintain consistency throughout the app
    const { data: allProducts, isLoading: loadingProducts, error, refetch: refetchAllProducts } = useGetProducts(page, limit);

    // console.log("allProducts", allProducts);
    return (
        <div className="pb-8 mb-8 flex flex-1 flex-col">
            {activeModule === 'home' && <HomePage isLoading={loadingProducts} products={allProducts} setCategory={setCategory} />}
            {activeModule === 'cart' && <CartPage />}
            {activeModule === 'add-product' && <CreateProduct refetchAllProducts={refetchAllProducts} />}
            {activeModule === 'profile' && <ProfilePage />}
            {activeModule === 'notifications' && <NotificationPage />}
        </div>
    );
};

export default BodySection;