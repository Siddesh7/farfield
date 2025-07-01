import { HeaderSection } from '@/components/layout';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { ArrowLeft, CirclePlus, Ellipsis, SendHorizontal } from 'lucide-react';
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

    const [comment, setComment] = useState<string>('')
    const { addToCart, cart } = useGlobalContext();
    const [showFullDescription, setShowFullDescription] = useState(false);

    console.log("product", product);

    const isInCart = cart.some((p) => p._id === product._id);

    return (
        <>
            {/* Image Container */}
            <div className='relative w-[-webkit-fill-available] h-[250px]'>
                <Image
                    src='/Product_Image.png'
                    alt='Product Image'
                    fill
                />
            </div>

            {/* Body Component */}
            <div className='flex flex-col gap-11 pt-5.5'>
                <div className='flex flex-col gap-5.5'>
                    <div className='flex flex-col gap-4.5'>
                        <div className='flex gap-2 bg-fade-background w-max px-2 py-1 rounded-md items-center'>
                            <Image
                                src='/profile.jpg'
                                alt={`User `}
                                width={30}
                                height={30}
                                className='rounded-md'
                            />
                            <p className='p-0 text-sm'>Saxenasaheb</p>
                        </div>
                        <p className='font-inter text-lg font-medium'>{product.name}</p>
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center'>
                                <p className='text-sm font-normal text-[#0000007A]'>Brought by:</p>
                                <div className='flex -space-x-4 ml-2'>
                                    {[1, 2, 3].map((_, idx) => (
                                        <Image
                                            key={idx}
                                            src='/profile.jpg'
                                            alt={`User ${idx + 1}`}
                                            width={30}
                                            height={30}
                                            className='rounded-md'
                                            style={{ zIndex: idx }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className='flex gap-2 items-center bg-blue'>
                                <div className="flex items-center justify-center">
                                    <Image
                                        src="/USDC.jpg"
                                        alt='USDC'
                                        width={30}
                                        height={30}
                                        className="rounded-md"
                                    />
                                </div>
                                <p className='font-semibold text-xl'>${product.price}</p>
                            </div>
                        </div>
                        {/* Description with View More/Less */}
                        <div>
                            <p className='font-inter text-sm font-normal text-[#0000007A]'>
                                {showFullDescription
                                    ? product.description
                                    : getTruncatedDescription(product.description, 150)
                                }
                                {product.description.length > 150 && (
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto min-h-0 text-blue-600 text-xs font-semibold ml-1 align-baseline"
                                        onClick={() => setShowFullDescription((prev) => !prev)}
                                    >
                                        {showFullDescription ? 'View Less' : 'View More'}
                                    </Button>
                                )}
                            </p>
                        </div>
                    </div>
                    <CommentComponent
                        comment={comment}
                        setComment={setComment}
                        user_comments={product.comments}
                    />
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