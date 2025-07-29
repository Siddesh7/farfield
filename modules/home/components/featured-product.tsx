import { AuthenticatedImage } from '@/components/common';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import Image from 'next/image';
import React from 'react';

const FeaturedProduct = ({
    product
}: {
    product: Product | null
}) => {

    const { setSelectedProduct } = useGlobalContext();

    if (product) {
        return (
            <div
                onClick={() => {
                    if (product) {
                        setSelectedProduct(product)
                    }
                }}
                className='max-w-screen h-[195px] overflow-hidden rounded-xl relative cursor-pointer'>
                <Image
                    src={`http://localhost:3000/api/images/${product.images[0]}`}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                />
            </div>
        );
    }


};

export { FeaturedProduct };