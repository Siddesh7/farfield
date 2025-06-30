import React, { useState } from 'react';
import { SearchFilter } from './search-filter';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FeaturedProducts } from '@/lib/utils';
import { ProductCard } from '@/components/common';
import { HeaderSection } from '@/components/layout';

const ProductTypes = ['All', 'Technology', 'Art', 'Books', 'Music', 'Miscellaneous'];

const HomeComponent = () => {
    const [selectedType, setSelectedType] = useState('All');

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
            </div>

            <div className='pt-6 flex gap-4 flex-col'>
                <div className='flex justify-between items-center'>
                    <p className='font-awesome text-2xl'>All Products</p>
                    <p className='text-sm font-medium text-[#0000007A]'>View all</p>
                </div>
                <ScrollArea className="rounded-md whitespace-nowrap flex">
                    <div className="flex pt-4 flex-wrap justify-between">
                        {FeaturedProducts.map((product) => (
                            <ProductCard product={product} />
                        ))}
                    </div>
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
            </div>
        </>
    );
};

export { HomeComponent };