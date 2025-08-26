import React from 'react';
import { ArrowLeft } from 'lucide-react'
import { useGlobalContext } from '@/context/global-context';
import Image from 'next/image';

const HeaderSection = () => {
    const { activeModule, selectedProduct, setActiveModule, setSelectedProduct } = useGlobalContext();

    const showBackArrow = selectedProduct && (activeModule === 'home')

    if (activeModule === 'profile') return null

    return (

        <div className='absolute top-0 z-10 w-full flex justify-between pt-7 px-5 items-center'>

            {showBackArrow ? <div className='bg-white rounded-xl px-3.5 py-2.5'>
                <ArrowLeft onClick={() => {
                    setActiveModule('home')
                    setSelectedProduct(null)
                }} />
            </div> : (
                <h1 className="font-awesome-italic text-2xl font-medium">
                    {(activeModule === 'home' || activeModule === 'cart' || activeModule === 'notifications') && (
                        <Image
                            src="/App_Logo.png"
                            alt='App Logo'
                            width={75}
                            height={30}
                        />
                    )}
                    {activeModule === 'add-product' && 'Add Product'}
                </h1>
            )}
        </div>
    );
};

export default HeaderSection;