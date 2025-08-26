import { Button } from '@/components/ui';
import { Product } from '@/lib/types/product';
import { CircleUser } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { CommentComponent } from './comment-component';
import { getTruncatedDescription } from '@/lib/utils';
import ProductAccessComponent from './product-access-component';
import { BASE_URL } from '@/config';

const ProductComponent = ({
    product
}: {
    product: Product
}) => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    
    // Show verified icon if the product creator is verified
    const shouldShowVerifiedIcon = product.creator.isVerified;

    return (
        <>
            <div className='relative aspect-[16/9]'>
                <Image
                    src={`${BASE_URL}/api/images/${product.images[0]}`}
                    alt={product.name}
                    className="object-cover"
                    fill
                />
            </div>

            <div className='flex flex-col gap-11 pt-5.5 px-5.5 pb-22'>
                <div className='flex flex-col gap-5.5'>
                    <div className='flex flex-col gap-4.5'>
                        <div className='flex justify-between items-center'>
                            <div className='flex gap-1 bg-fade-background w-max px-1.5 py-1 rounded-md items-center border border-[#0000000A]'>
                                <div className='relative w-5 h-5'>
                                    <img
                                        src={product.creator?.pfp}
                                        alt={product.creator?.name}
                                        className='rounded-xs object-cover w-full h-full'
                                    />
                                </div>
                                <p className='p-0 text-sm text-[#000000A3]'>{product.creator.username}</p>
                                {shouldShowVerifiedIcon && (
                                    <Image
                                        src="/verified.jpg"
                                        alt='Verified Icon'
                                        width={16}
                                        height={16}
                                    />
                                )}
                            </div>
                            <div className='flex gap-2 items-center bg-blue'>
                                {product.price > 0 && (
                                    <div className="flex items-center justify-center">
                                        <Image
                                            src="/USDC.jpg"
                                            alt='USDC'
                                            width={24}
                                            height={24}
                                            className="rounded-md"
                                        />
                                    </div>
                                )}
                                <p className='font-semibold text-xl'>
                                    {product.price === 0 ? 'Free' : `$${product.price}`}
                                </p>
                            </div>
                        </div>
                        <div className='flex flex-col'>
                            <p className='font-inter text-lg font-medium'>{product.name}</p>
                        </div>
                        {product.buyers && product.buyers.length > 0 && (
                            <div className='flex justify-between items-center py-2'>
                                <div className='flex items-center'>
                                    <p className='text-sm font-normal text-fade'>Bought by:</p>
                                    <div className='flex -space-x-2 ml-2'>
                                        {product.buyers.map((buyer, idx) => (
                                            <div className='relative w-7 h-7 ' key={idx}>
                                                <img
                                                    src={buyer?.pfp || "/profile.jpg"}
                                                    alt={`User ${idx + 1}`}
                                                    className='rounded-md p-1 bg-white object-cover w-full h-full'
                                                    style={{ zIndex: idx }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <p className='font-inter text-sm font-normal text-fade'>
                                {showFullDescription
                                    ? product.description
                                    : getTruncatedDescription(product.description, 150)
                                }
                                {product.description.length > 150 && (
                                    <Button
                                        variant="link"
                                        className="p-0 cursor-pointer h-auto min-h-0 text-blue-600 text-xs font-semibold ml-1 align-baseline"
                                        onClick={() => setShowFullDescription((prev) => !prev)}
                                    >
                                        {showFullDescription ? 'View Less' : 'View More'}
                                    </Button>
                                )}
                            </p>
                        </div>
                    </div>
                    <CommentComponent
                        product={product}
                    />
                </div>
            </div>

            <div className="fixed left-0 bottom-17 w-full backdrop-blur-3xl bg-gradient-to-t from-gray-300/95 to-transparent px-4 py-4">
                <ProductAccessComponent product={product} />
            </div>
        </>
    );
};

export { ProductComponent };