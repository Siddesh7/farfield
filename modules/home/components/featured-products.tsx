import { BASE_URL } from '@/config';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import Image from 'next/image';
import React from 'react';

const FeaturedProducts = ({
    product
}: {
    product: Product | null
}) => {

    const { setSelectedProduct } = useGlobalContext();

    if (product) {
        return (
            <div className='pt-4 flex gap-4 flex-col'>
            <p className='font-awesome text-2xl'>Featured Products</p>
    
            <div
                onClick={() => {
                    if (product) {
                        setSelectedProduct(product)
                    }
                }}
                className='max-w-screen h-[200px] overflow-hidden rounded-xl relative cursor-pointer'>
                <img
                    src={`${BASE_URL}/api/images/${product.images[0]}`}
                    alt={product.name}
                    style={{objectFit:'cover'}}
                    className="object-cover w-full h-full"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-b-xl" />
                    
                    <div className="relative flex justify-between items-end">
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
          </div>
            
        );
    }
};

export { FeaturedProducts };