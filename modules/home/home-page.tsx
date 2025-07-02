import React from 'react';
import { BoxContainer } from '@/components/common';
import { useGlobalContext } from '@/context/global-context';
import { HomeComponent } from './components/home-component';
import { ProductComponent } from './components/product-component';
import { Product } from '@/lib/types/product';

const ProductTypes = ['All', 'Technology', 'Art', 'Books', 'Music', 'Miscellaneous'];

const HomePage = ({ products, setCategory }: { products: Product[], setCategory: (category: string) => void }) => {
    const { selectedProduct } = useGlobalContext();

    return (
        <BoxContainer className='flex flex-col'>
            {/* <AuthenticatedImage fileKey={fileKey} alt="Product File" /> */}
            {selectedProduct ? (
                <ProductComponent product={selectedProduct} />
            ) : (
                <HomeComponent products={products} setCategory={setCategory} ProductTypes={ProductTypes} />
            )}

        </BoxContainer>
    );
};

export default HomePage;