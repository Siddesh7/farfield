import React, { useState } from "react";
import { SearchFilter } from "./search-filter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FeaturedProducts } from "@/lib/utils";
import { AuthenticatedImage, ProductCard } from "@/components/common";
import { Product } from "@/lib/types/product";
import Image from "next/image";
import { useGlobalContext } from "@/context/global-context";

const HomeComponent = ({
  products,
  setCategory,
  ProductTypes,
}: {
  products: Product[];
  setCategory: (category: string) => void;
  ProductTypes: string[];
}) => {
  const [selectedType, setSelectedType] = useState("All");

  const { setSelectedProduct } = useGlobalContext();

  const topProduct = products[0];

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
        <div
          onClick={() => {
            setSelectedProduct(topProduct)
          }}
          className='max-w-screen h-[195px] overflow-hidden rounded-xl relative cursor-pointer'>
          <AuthenticatedImage fileKey={topProduct.images[0]} alt="Product File" />
        </div>
      </div>

      <div className='pt-6 flex gap-4 flex-col'>
        <div className='flex justify-between items-center'>
          <p className='font-awesome text-2xl'>All Products</p>
        </div>
        {products.length > 0 ? (
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
        )}
      </div>

    </div>
  );
};

export { HomeComponent };




