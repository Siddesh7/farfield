import React, { FC, useState } from "react";
import { SearchFilter } from "./search-filter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProductCard } from "@/components/common";
import { Product } from "@/lib/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedProduct } from "./featured-product";

type HomeComponentProps = {
  isLoading: boolean;
  products: Product[],
  setCategory: (category: string) => void,
  ProductTypes: string[],
}

const HomeComponent: FC<HomeComponentProps> = ({
  isLoading,
  products,
  setCategory,
  ProductTypes,
}) => {
  const [selectedType, setSelectedType] = useState("All");

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

      <div className='pt-4 flex gap-4 flex-col'>
        <p className='font-awesome text-2xl'>Featured Products</p>

        {isLoading ? (
          <>
            <Skeleton className="h-[195px] w-full rounded-xl " />
          </>
        ) : (
          <>
            <FeaturedProduct product={featuredProduct} />
          </>
        )}
      </div>

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
            <ScrollArea className="rounded-md whitespace-nowrap flex">
              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {products.map((product: Product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
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




