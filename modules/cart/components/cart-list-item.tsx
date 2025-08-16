import { Product } from '@/lib/types/product';
import { X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useGlobalContext } from '@/context/global-context';
import { toast } from 'sonner';
import { BASE_URL } from '@/config';

const CartListItem = ({
    product
}: {
    product: Product
}) => {
    const { removeFromCart } = useGlobalContext();
    return (
        <div className='py-5 border-b flex justify-between'>
            <div className='flex gap-3'>
                <div className='relative w-[-webkit-fill-available] h-[84px] w-[84px]'>
                    <img
                        src={`${BASE_URL}/api/images/${product.images[0]}`}
                        alt={product.name}
                        style={{ objectFit: "cover" }}
                        className="object-cover w-full h-full rounded-xl"
                    />
                </div>
                <div className='flex gap-2 flex-col max-w-[164px] py-2'>
                    <p className='p-0 text-sm text-[#000000A3] whitespace-normal break-words'>
                        {product.name.split(' ').slice(0, 7).join(' ')}
                        {product.name.split(' ').length > 7 ? '...' : ''}
                    </p>
                    <p className='text-sm '>${product.price}</p>

                </div>
            </div>
            <div>
                <button
                    onClick={() => {
                        removeFromCart(product.id);
                        toast.success('Removed from cart!');
                    }}
                    aria-label="Remove from cart"
                    className="p-1 rounded hover:bg-gray-100"
                >
                    <X size={16} color='#0000007A' />
                </button>
            </div>
        </div>
    );
};

export { CartListItem };