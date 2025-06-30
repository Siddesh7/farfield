import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { CircleUser } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const ProductCard = ({
    product
}: {
    product: Product
}) => {

    const { setSelectedProduct, setActiveModule } = useGlobalContext();

    return (
        <div onClick={() => {
            setSelectedProduct(product)
        }}
            className='w-max flex-shrink-0 flex flex-col gap-3 rounded-xl pb-6 cursor-pointer'>
            <div className="relative w-[170px] h-[195px] overflow-hidden rounded-xl">
                <Image
                    src='/Product_Image.png'
                    alt='product Image'
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-xl"
                />
                <div className='absolute top-2 left-2 flex gap-2 bg-white rounded-md px-2 py-1 items-center shadow'>
                    <CircleUser /> Art
                </div>
            </div>

            <div className='flex gap-2 flex-col'>
                <p className=' min-w-[170px] max-w-[170px] p-0 text-sm text-[#000000A3] whitespace-normal break-words'>
                    {product.name.split(' ').slice(0, 7).join(' ')}
                    {product.name.split(' ').length > 7 ? '...' : ''}
                </p>
                <p className='text-sm '>${product.price}</p>

            </div>

        </div>
    );
};

export { ProductCard };