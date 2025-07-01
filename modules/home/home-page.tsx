import React, { useState } from 'react';
import { AuthenticatedImage, BoxContainer } from '@/components/common';
import { useGlobalContext } from '@/context/global-context';
import { HomeComponent } from './components/home-component';
import { ProductComponent } from './components/product-component';
import { useProduct } from '@/lib/hooks/use-product';
import { LoadingSpinner } from '@/components/ui';

const ProductTypes = ['All', 'Technology', 'Art', 'Books', 'Music', 'Miscellaneous'];

const HomePage = () => {
    const { selectedProduct } = useGlobalContext();
    console.log("selected product", selectedProduct);

    // Add state for pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [category, setCategory] = useState<string>('Technology')
    const queryString = `page=${page}&limit=${limit}&category=${category}`;

    // Fetch all products using the custom hook
    const { data, error, isLoading } = useProduct(queryString);
    console.log('products data', data);
    console.log('products error', error);
    console.log('products loading', isLoading);

    // const fileKey = '1751374321050_WhatsApp Image 2025-06-29 at 18.17.06.jpeg'
    // const fileKey = '1751376889067_WhatsApp Image 2025-06-29 at 18.17.06.jpeg'
    // const fileKey = '1751377303162_WhatsApp Image 2025-06-29 at 18.17.06.jpeg'

    return (
        <BoxContainer className='flex flex-col pt-5 px-5.5'>
            {/* <AuthenticatedImage fileKey={fileKey} alt="Product File" /> */}

            {isLoading ? (
                <div>
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {selectedProduct ? (
                        <ProductComponent product={selectedProduct} />
                    ) : (
                        <HomeComponent products={data} setCategory={setCategory} ProductTypes={ProductTypes} />
                    )}
                </>
            )}

        </BoxContainer>
    );
};

export default HomePage;