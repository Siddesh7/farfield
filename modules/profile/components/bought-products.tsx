import React from 'react';
import { Product } from '@/lib/types/product';
import { FeaturedProducts } from '@/lib/utils';
import { ProductListItem } from './product-list-item';
import { PurchaseHistoryResponse } from '@/query';

const BoughtProducts = ({ purchasedproducts }: { purchasedproducts: PurchaseHistoryResponse }) => {
    console.log("purchasedproducts", purchasedproducts);

    if (!purchasedproducts?.purchases || purchasedproducts.purchases.length === 0) {
        return <div className='px-5.5 pt-4 text-center text-gray-500'>No Bought products</div>;
    }

    return (
        <div className='px-5.5 pt-4'>
            {FeaturedProducts.map((product: Product) => (
                <ProductListItem product={product} />
            ))}
        </div>
    );
};

export default BoughtProducts;