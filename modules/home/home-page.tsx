import { ProductCard } from '@/common/reusables';
import SearchFilter from '@/components/homePage/search-filter';
import { FeaturedProducts } from '@/lib/utils';
import React, { useState } from 'react';

const HomePage = () => {

    const ProductTypes = ['All', 'Technology', 'Art', 'Books', 'Music', 'Miscellaneous'];
    const [selectedType, setSelectedType] = useState('All');

    return (
        <div className='px-5 py-5'>
            <SearchFilter />

            <div className="flex gap-3 py-3 overflow-x-auto scrollbar-hide">
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

            <div className='pt-6 flex gap-4 flex-col'>
                <p className='font-awesome text-2xl'>Featured Products</p>
                <div className='flex gap-4 overflow-x-auto scrollbar-hide pb-4'>
                    {FeaturedProducts.map((product) => (
                        <ProductCard product={product} />
                    ))}
                </div>
            </div>

            <div className='pt-6 flex gap-4 flex-col'>
                <div className='flex justify-between items-center'>
                    <p className='font-awesome text-2xl'>All Products</p>
                    <p className='text-sm font-medium text-[#0000007A]'>View all</p>
                </div>
                <div className='flex gap-4 overflow-x-auto scrollbar-hide pb-4'>
                    {FeaturedProducts.map((product) => (
                        <ProductCard product={product} />
                    ))}
                </div>
            </div>


        </div>
    );
};

export default HomePage;