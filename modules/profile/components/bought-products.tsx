import React from 'react';
import { PurchaseHistoryItem } from '@/query';
import BoughtProductItem from './bought-product-item';

const BoughtProducts = ({ purchasedproducts }: { purchasedproducts: PurchaseHistoryItem[] }) => {

    if (!purchasedproducts || purchasedproducts.length === 0) {
        return <div className='px-5.5 pt-4 text-center text-gray-500'>No Bought products</div>;
    }

    // Flatten all purchased items from all purchases
    const allPurchasedItems = purchasedproducts.flatMap(purchase => 
        purchase.items.filter(item => item.product) // Only include items with valid product data
    );

    return (
        <div className='px-5.5 pt-4'>
            {allPurchasedItems.map((purchasedItem, index) => {
                const productData = {
                    id: purchasedItem.productId, // Add the actual product ID
                    name: purchasedItem.product?.name || 'Unknown Product',
                    price: purchasedItem.price,
                    images: purchasedItem.product?.thumbnail ? [purchasedItem.product.thumbnail] : []
                };
                
                return (
                    <BoughtProductItem 
                        key={`${purchasedItem.productId}-${index}`}
                        product={productData as any} 
                    />
                );
            })}
        </div>
    );
};

export default BoughtProducts;