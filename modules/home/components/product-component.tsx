import { Button } from '@/components/ui';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { CirclePlus } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { toast } from "sonner";
import { CommentComponent } from './comment-component';
import { getTruncatedDescription } from '@/lib/utils';

const ProductComponent = ({
    product
}: {
    product: Product
}) => {

    const { addToCart, cart } = useGlobalContext();
    const [showFullDescription, setShowFullDescription] = useState(false);

    const isInCart = cart.some((p) => p.id === product.id);

    console.log("product", product);
    return (
        <>
            {/* Image Container */}
            <div className='relative w-[-webkit-fill-available] h-[275px]'>
                <Image
                    src={`http://localhost:3000/api/images/${product.images[0]}`}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                />
            </div>

            {/* Body Component */}
            <div className='flex flex-col gap-11 pt-5.5 px-5.5'>
                <div className='flex flex-col gap-5.5'>
                    <div className='flex flex-col gap-4.5'>
                        <div className='flex justify-between items-center'>
                            <div className='flex gap-2 bg-fade-background w-max px-1.5 py-1 rounded-md items-center border border-[#0000000A]'>
                                <div className='relative w-5 h-5'>
                                    <img
                                        src={product.creator?.pfp}
                                        alt={product.creator?.name}
                                        className='rounded-xs object-cover w-full h-full'
                                    />
                                </div>
                                <p className='p-0 text-sm text-[#000000A3]'>{product.creator.username}</p>
                            </div>
                            <div className='flex gap-2 items-center bg-blue'>
                                <div className="flex items-center justify-center">
                                    <Image
                                        src="/USDC.jpg"
                                        alt='USDC'
                                        width={24}
                                        height={24}
                                        className="rounded-md"
                                    />
                                </div>
                                <p className='font-semibold text-xl'>${product.price}</p>
                            </div>
                        </div>
                        <p className='font-inter text-lg font-medium'>{product.name}</p>
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center'>
                                <p className='text-sm font-normal text-fade'>Bought by:</p>
                                <div className='flex -space-x-4 ml-2'>
                                    {/* {[1, 2, 3].map((_, idx) => (
                                        <Image
                                            key={idx}
                                            src='/profile.jpg'
                                            alt={`User ${idx + 1}`}
                                            width={22}
                                            height={22}
                                            className='rounded-xs'
                                            style={{ zIndex: idx }}
                                        />
                                    ))} */}
                                </div>
                            </div>


                        </div>
                        {/* Description with View More/Less */}
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
                    {/* <CommentComponent
                        product={product}
                        user_comments={product.comments}
                    /> */}
                </div>
            </div>


            <div className="fixed left-0 bottom-12 w-full backdrop-blur-3xl bg-gray-200/60 px-4 pt-6 pb-8">
                <Button
                    size='lg'
                    className={`w-full font-semibold ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => {
                        if (!isInCart) {
                            addToCart(product);
                            toast.success('Added to cart!');
                        }
                    }}
                    disabled={isInCart}
                >
                    <CirclePlus />
                    {isInCart ? 'Added to Cart' : 'Add to Cart'}
                </Button>
            </div>

        </>
    );
};

export { ProductComponent };