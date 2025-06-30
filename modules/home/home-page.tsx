import { BoxContainer } from '@/components/common';
import React from 'react';
import { useGlobalContext } from '@/context/global-context';
import { HomeComponent } from './components/home-component';
import { ProductComponent } from './components/product-component';

const HomePage = () => {

    const { selectedProduct } = useGlobalContext();
    console.log("selected product", selectedProduct);

    return (
        <BoxContainer className='flex flex-col pt-5 px-5.5'>

            {selectedProduct ? (
                <ProductComponent product={selectedProduct} />
            ) : (
                <HomeComponent />
            )}

        </BoxContainer>
    );
};

export default HomePage;