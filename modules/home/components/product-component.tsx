import { Button } from '@/components/ui';
import { Product } from '@/lib/types/product';
import { CircleUser } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { toast } from "sonner";
import { CommentComponent } from './comment-component';
import { getTruncatedDescription } from '@/lib/utils';
import { StarIcon } from '@/components/icons';
import { useAuthenticatedAPI, useIsBuyer, useOwner } from '@/lib/hooks';
import { useProductAccess } from '@/query';
import ProductAccessComponent from './product-access-component';

const ProductComponent = ({
    product
}: {
    product: Product
}) => {

    const { data, isLoading, error } = useProductAccess(product.id);
    console.log("isLoading data access",data,isLoading);

    const [showFullDescription, setShowFullDescription] = useState(false);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [displayAverage, setDisplayAverage] = useState<number>(product.ratingsScore || 0);
    const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

    const { isBuyer, isLoading:checkingBuyer } = useIsBuyer(product);
    const { post } = useAuthenticatedAPI();

    const canRate = isBuyer && !checkingBuyer;

    const handleRate = async (rating: number) => {
        if (!canRate || isSubmittingRating) return;
        setIsSubmittingRating(true);
        try {
            const res = await post(`/api/products/${product.id}/ratings`, { rating });
            if (res?.success) {
                const avg = res?.data?.averageRating ?? res?.data?.ratingsScore ?? product.ratingsScore;
                setDisplayAverage(avg);
                toast.success('Rating added successfully');
            } else {
                toast.error(res?.error || res?.message || 'Failed to submit rating');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to submit rating');
        } finally {
            setIsSubmittingRating(false);
        }
    }

    console.log("Product >>",product);
    

    return (
        <>
            <div className='relative w-[-webkit-fill-available] h-[275px]'>
                <Image
                    src={`http://localhost:3000/api/images/${product.images[0]}`}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                />
            </div>

            <div className='flex flex-col gap-11 pt-5.5 px-5.5 pb-18'>
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
                        <div className='flex flex-col gap-2'>
                            <p className='font-inter text-lg font-medium'>{product.name}</p>
                            <div className="flex gap-2 bg-[#0000000A] w-min rounded-[4px] px-1.5 items-center shadow">
                                <CircleUser size={20} /> {product.category}
                            </div>
                        </div>
                        <div className='flex justify-between items-center py-2'>
                            <div className='flex gap-1 items-center'>
                                {[1,2,3,4,5].map((star) => {
                                    const isActive = hoverRating != null
                                        ? star <= (hoverRating as number)
                                        : star <= Math.floor(displayAverage || 0);
                                    return (
                                        <StarIcon
                                            key={star}
                                            width={20}
                                            isActive={isActive}
                                            onMouseEnter={canRate ? () => setHoverRating(star) : undefined}
                                            onMouseLeave={canRate ? () => setHoverRating(null) : undefined}
                                            onClick={canRate ? () => handleRate(star) : undefined}
                                            className={canRate ? 'cursor-pointer' : 'cursor-default'}
                                        />
                                    );
                                })}
                            </div>

                            {product.buyers && product.buyers.length > 0 && (
                                <div className='flex items-center'>
                                    <p className='text-sm font-normal text-fade'>Bought by:</p>
                                    <div className='flex -space-x-4 ml-2'>
                                        {product.buyers.map((buyer, idx) => (
                                            <Image
                                                key={idx}
                                                src={buyer?.pfp || "/profile.jpg"}
                                                alt={`User ${idx + 1}`}
                                                width={22}
                                                height={22}
                                                className='rounded-xs'
                                                style={{ zIndex: idx }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
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
                        user_comments={product.comments}
                    />
                </div>
            </div>

            <ProductAccessComponent product={product}/>

        </>
    );
};

export { ProductComponent };