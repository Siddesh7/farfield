import { BoxContainer } from '@/components/common';
import React from 'react';
import { useGlobalContext } from '@/context/global-context';
import { HomeComponent } from './components/home-component';
import { ProductComponent } from './components/product-component';

const HomePage = () => {

    const { selectedProduct } = useGlobalContext();

    return (
        <BoxContainer className='flex flex-col'>

            {selectedProduct ? (
                <ProductComponent product={selectedProduct} />
            ) : (
                <HomeComponent />
            )}

        </BoxContainer>
    );
};

export default HomePage;