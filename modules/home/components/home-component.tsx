import React, { FC, useState, useEffect, useRef } from "react";
import { SearchFilter } from "./search-filter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProductCard } from "@/components/common";
import { Product } from "@/lib/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedProducts } from "./featured-products";

type HomeComponentProps = {
  isLoading: boolean;
  products: Product[];
  setCategory: (category: string) => void;
  ProductTypes: string[];
  loadNextPage: () => void;
  loadingMore: boolean;
  // Search props
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  searchQuery: string;
  searchResults: Product[];
  searchLoading: boolean;
}

const HomeComponent: FC<HomeComponentProps> = ({
  isLoading,
  products,
  setCategory,
  ProductTypes,
  loadNextPage,
  loadingMore,
  onSearch,
  onClearSearch,
  isSearching,
  searchQuery,
  searchResults,
  searchLoading,
}) => {
  const [selectedType, setSelectedType] = useState("All");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Update the parent component's category when selectedType changes
  useEffect(() => {
    setCategory(selectedType);
  }, [selectedType, setCategory]);

  // Simple scroll detection - using window scroll
  useEffect(() => {
    // Don't scroll-load when searching
    if (isSearching) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
      
      if (isNearBottom && !loadingMore && !isLoading && products.length > 0) {
        console.log('Loading next page...'); // Debug log
        loadNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadNextPage, loadingMore, isLoading, products.length, isSearching]);

  // Determine what products to show
  const displayProducts = isSearching ? searchResults : products;
  const displayLoading = isSearching ? searchLoading : isLoading;
  const featuredProduct = displayLoading ? null : displayProducts[0];

  return (
    <div className='pt-22 px-5.5'>
      <SearchFilter 
        onSearch={onSearch}
        onClear={onClearSearch}
        isSearching={isSearching}
        searchQuery={searchQuery}
      />

      {/* Only show category filters when not searching */}
      {!isSearching && (
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
      )}

      {/* Search results header */}
      {/* {isSearching && (
        <div className="py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {searchLoading ? 'Searching...' : `Results for "${searchQuery}"`}
          </h2>
          {!searchLoading && (
            <p className="text-sm text-muted-foreground">
              {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      )} */}

      {displayLoading ? (
        <>
          <Skeleton className="h-[195px] w-full rounded-xl " />
        </>
      ) : (
        <>
          {/* Only show featured products when not searching */}
          {!isSearching && <FeaturedProducts product={featuredProduct} />}
        </>
      )}

      <div className='pt-6 flex gap-4 flex-col'>
        <div className='flex justify-between items-center'>
          <p className='font-awesome text-2xl'>
            {isSearching ? 'Search Results' : 'All Products'}
          </p>
        </div>

        {displayLoading && isSearching ? (
          // Search loading skeletons
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
        ) : displayProducts.length === 0 && isSearching ? (
          // No search results
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No products found for "{searchQuery}"</p>
            <button 
              onClick={onClearSearch}
              className="text-primary hover:underline"
            >
              Clear search and browse all products
            </button>
          </div>
        ) : displayLoading ? (
          // Regular loading
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
          // Display products
          displayProducts.length > 0 ? (
            <ScrollArea ref={scrollAreaRef} className="rounded-md whitespace-nowrap flex">
              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {displayProducts.map((product: Product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
                {/* Loading indicator for next page - only for regular browsing */}
                {!isSearching && loadingMore && (
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




