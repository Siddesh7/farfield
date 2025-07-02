import { Product } from '@/lib/types/product';
import Image from 'next/image';
import React from 'react';

const ProductListItem = ({
    product
}: {
    product: Product
}) => {
    return (
        <div className='py-5 border-b flex justify-between items-center'>
            <div className='flex gap-3 items-center'>
                <Image
                    src='/Product_Image.png'
                    alt='product Image'
                    width={40}
                    height={40}
                    className="max-h-[40px] min-h-[40px] rounded-sm"
                />
                <div className='flex gap-2 flex-col max-w-[164px] py-2'>
                    <p className='p-0 text-sm text-[#000000A3] whitespace-normal break-words'>
                        {product.name.split(' ').slice(0, 7).join(' ')}
                        {product.name.split(' ').length > 7 ? '...' : ''}
                    </p>
                </div>
            </div>
            <p className='text-lg font-semibold'>${product.price}</p>
        </div>
    );
};

export { ProductListItem };