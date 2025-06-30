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

const ProductComponent = ({
    product
}: {
    product: Product
}) => {

    const [comment, setComment] = useState<string>('')
    const { addToCart, cart } = useGlobalContext();

    console.log("product ", product);

    const isInCart = cart.some((p) => p._id === product._id);

    return (
        <>
            {/* Image Container */}
            <div className=''>
                <Image
                    src='/Product_Image.png'
                    alt='Product Image'
                    height={250}
                    width={350}
                />
            </div>

            {/* Body Component */}
            <div className='flex flex-col gap-11 pb-9'>
                <div className='flex flex-col gap-5.5'>
                    <div className='flex flex-col gap-4.5'>
                        <div></div>
                        <p className='font-inter text-lg font-medium'>{product.name}</p>
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center'>
                                <p className='text-sm font-normal text-[#0000007A]'>Brought by:</p>
                                <div className='flex -space-x-4 ml-2'>
                                    {product.buyer.map((_, idx) => (
                                        <Image
                                            key={idx}
                                            src='/profile.jpg'
                                            alt={`User ${idx + 1}`}
                                            width={40}
                                            height={40}
                                            className='rounded-xl'
                                            style={{ zIndex: idx }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className='font-semibold text-xl'>${product.price}</p>
                            </div>
                        </div>
                        <p className='font-inter text-sm font-normal text-[#0000007A]'>{product.description}</p>
                    </div>
                    <div className='flex my-3 h-auto border-dashed border rounded-lg'>
                        <Input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder='Add Any Comment'
                            className='bg-fade-background flex-1 rounded-tr-none rounded-br-none h-auto'
                        />
                        <Button size='lg' className='bg-fade-background text-[#0000007A] rounded-tl-none rounded-bl-none'> Send <SendHorizontal /> </Button>
                    </div>

                    {product.comments.map((comment) => (
                        <div className='flex justify-between'>
                            <div className='flex flex-col gap-1' >
                                <div className='flex gap-1 items-center'>
                                    <Image src='/profile.jpg' alt='Profile' width={28} height={28} className='rounded-md' />
                                    <p className='p-0 text-[#000000A3]'>Saxenasaheb</p>
                                </div>
                                <p className='p-o text-[#0000007A]'>{comment.comment}</p>
                            </div>
                            <Ellipsis color='#0000007A' />
                        </div>
                    ))}
                </div>

                <Button
                    size='lg'
                    className={`font-semibold ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
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