import React, { useState } from 'react';
import { SearchFilter } from './search-filter';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FeaturedProducts } from '@/lib/utils';
import { ProductCard } from '@/components/common';
import { HeaderSection } from '@/components/layout';
import { Product } from '@/lib/types/product';
import Image from 'next/image';
import { useGlobalContext } from '@/context/global-context';

const ProductTypes = ['All', 'Technology', 'Art', 'Books', 'Music', 'Miscellaneous'];

const HomeComponent = () => {
    const [selectedType, setSelectedType] = useState('All');

    const { setSelectedProduct } = useGlobalContext();

    const topProduct = FeaturedProducts[0];

    return (
        <>
            <SearchFilter />

            <ScrollArea className="rounded-md whitespace-nowrap">
                <div className="flex w-max space-x-4 py-4">
                    {ProductTypes.map((type) => (
                        <div
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-2.5 font-inter rounded-lg cursor-pointer transition-all 
                ${selectedType === type ? 'bg-[#000] text-white' : 'bg-[#0000000A] text-[#0000007A]'}`}
                        >
                            {type}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className='pt-4 flex gap-4 flex-col'>
                <p className='font-awesome text-2xl'>Featured Products</p>
                <div
                    onClick={() => {
                        setSelectedProduct(topProduct)
                    }}
                    className='max-w-screen h-[195px] overflow-hidden rounded-xl relative cursor-pointer'>
                    <Image
                        src='/Product_Image.png'
                        alt='product Image'
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-xl"
                    />
                </div>
            </div>

            <div className='pt-6 flex gap-4 flex-col'>
                <div className='flex justify-between items-center'>
                    <p className='font-awesome text-2xl'>All Products</p>
                    <p className='text-sm font-medium text-[#0000007A]'>View all</p>
                </div>
                <ScrollArea className="rounded-md whitespace-nowrap flex">
                    <div className="grid grid-cols-2 gap-2.5 pt-4">
                        {FeaturedProducts.map((product: Product) => (
                            <ProductCard product={product} key={product._id} />
                        ))}
                    </div>
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
            </div>
        </>
    );
};

export { HomeComponent };