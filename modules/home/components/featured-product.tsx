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
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex justify-between items-end">
                        <div className="flex-1 pr-4">
                            <h3 className="text-sm font-semibold mb-1 truncate">
                                {product.name}
                            </h3>
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                            <span className="text-sm font-bold">
                                ${product.price}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export { FeaturedProduct };