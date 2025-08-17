import React, { FC, useState, useEffect, useRef } from "react";
import { SearchFilter } from "./search-filter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProductCard } from "@/components/common";
import { Product } from "@/lib/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedProducts } from "./featured-products";

type HomeComponentProps = {
    isLoading: boolean;
    products: Product[],
    setCategory: (category: string) => void,
    ProductTypes: string[],
    loadNextPage: () => void;
    loadingMore: boolean;
}

const HomeComponent: FC<HomeComponentProps> = ({
    isLoading,
    products,
    setCategory,
    ProductTypes,
    loadNextPage,
    loadingMore,
}) => {
    const [selectedType, setSelectedType] = useState("All");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Update the parent component's category when selectedType changes
    useEffect(() => {
        setCategory(selectedType);
    }, [selectedType, setCategory]);

    // Simple scroll detection - using window scroll
    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
            
            if (isNearBottom && !loadingMore && !isLoading && products.length > 0) {
                loadNextPage();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadNextPage, loadingMore, isLoading, products.length]);

    const featuredProduct = isLoading ? null : products[0];

    return (
        <div className='pt-22 px-5.5'>
            <SearchFilter />

            <ScrollArea className="rounded-md whitespace-nowrap">
                <div className="flex w-max space-x-4 py-4">
                    {ProductTypes.map((type) => (
                        <div
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-2.5 font-inter rounded-lg cursor-pointer transition-all 
                            ${selectedType === type ? 'bg-[#000] text-white' : 'bg-[#0000000A] text-fade'}`}
                        >
                            {type}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {isLoading ? (
                <>
                    <Skeleton className="h-[195px] w-full rounded-xl " />
                </>
            ) : (
                <>
                    <FeaturedProducts product={featuredProduct} />
                </>
            )}

            <div className='pt-6 flex gap-4 flex-col'>
                <div className='flex justify-between items-center'>
                    <p className='font-awesome text-2xl'>All Products</p>
                </div>
                {isLoading ? (
                    <ScrollArea className="rounded-md whitespace-nowrap flex">
                        <div className="grid grid-cols-2 gap-2.5 pt-4">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                ) : (
                    products.length > 0 ? (
                        <ScrollArea ref={scrollAreaRef} className="rounded-md whitespace-nowrap flex">
                            <div className="grid grid-cols-2 gap-2.5 pt-4">
                                {products.map((product: Product) => (
                                    <ProductCard product={product} key={product.id} />
                                ))}
                                {/* Loading indicator for next page */}
                                {loadingMore && (
                                    <>
                                        {Array.from({ length: 2 }).map((_, index) => (
                                            <div key={`loading-${index}`} className="flex flex-col gap-2">
                                                <Skeleton className="h-32 w-full rounded-lg" />
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    ) : (
                        <div>No Products Found</div>
                    )
                )}
            </div>

        </div>
    );
};

export { HomeComponent };




