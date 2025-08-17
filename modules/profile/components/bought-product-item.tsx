import React, { useState } from 'react'
import { BASE_URL } from '@/config';
import { Product } from '@/lib/types/product';
import { ArrowRightUpIcon, EditIcon } from '@/components/icons';
import { ProductDetailDrawer } from '@/components/common';

const BoughtProductItem = ({
    product
}: {
    product: Product
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleProductClick = () => {
        setIsDrawerOpen(true);
    };

    return (
        <>
            <div 
                className='py-5 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg px-2 -mx-2'
                onClick={handleProductClick}
            >
                <div className='flex gap-3 items-center'>
                    <div className="relative h-[40px] w-[40px]">
                        <img
                            src={`${BASE_URL}/api/images/${product.images[0]}`}
                            alt={product.name}
                            style={{ objectFit: "cover" }}
                            className="object-cover w-full h-full rounded-sm"
                        />
                    </div>
                    <div className='flex gap-2 flex-col max-w-[164px] py-2'>
                        <p className='p-0 text-sm text-[#000000A3] whitespace-normal break-words'>
                            {product.name.split(' ').slice(0, 7).join(' ')}
                            {product.name.split(' ').length > 7 ? '...' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex flex-row gap-3 items-center">
                    <p className='text-lg font-medium'>
                        {product.price === 0 ? 'Free' : `$${product.price}`}
                    </p>
                    <div className="opacity-60">
                        <ArrowRightUpIcon width={16} />
                    </div>
                </div>
            </div>
            
            <ProductDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                productId={product.id}
            />
        </>
    )
}

export default BoughtProductItem