import { Product } from '@/lib/types/product';
import React from 'react';
import ListedProductItem from './listed-product-item';

const ListedProducts = ({ listedProducts }: { listedProducts: Product[] }) => {

    if (!listedProducts || listedProducts.length === 0) {
        return <div className='px-5.5 pt-4 text-center text-gray-500'>No Listed products</div>;
    }

    return (
        <div className='px-5.5 pt-4'>
            {listedProducts.map((product: Product) => (
                <ListedProductItem product={product} key={product.id}/>
            ))}
        </div>
    );
};

export default ListedProducts;