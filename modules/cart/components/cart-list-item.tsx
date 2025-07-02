import { Product } from '@/lib/types/product';
import { X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useGlobalContext } from '@/context/global-context';
import { toast } from 'sonner';

const CartListItem = ({
    product
}: {
    product: Product
}) => {
    const { removeFromCart } = useGlobalContext();
    return (
        <div className='py-5 border-b flex justify-between'>
            <div className='flex gap-3'>
                <Image
                    src='/Product_Image.png'
                    alt='product Image'
                    width={81}
                    height={81}
                    className="max-h-[84px] min-h-[84px] rounded-xl"
                />
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
                        removeFromCart(product._id!);
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