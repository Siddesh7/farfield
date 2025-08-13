import React from 'react';
import { useProductAccess } from '@/query/use-product-access';
import { Button } from '@/components/ui';
import { CirclePlus, Download, ExternalLink, ShoppingCart, CreditCard, Edit } from 'lucide-react';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { toast } from "sonner";
import { DoubleTickIcon } from '@/components/icons';
import { useAuthenticatedFetch } from '@/lib/hooks/use-authenticated-fetch';

interface ProductAccessComponentProps {
  product: Product
}

const ProductAccessComponent: React.FC<ProductAccessComponentProps> = ({ product }) => {
  const { data, isLoading, error } = useProductAccess(product.id);
  const { addToCart, cart } = useGlobalContext();
  const isInCart = cart.some((p) => p.id === product.id);
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Handle download functionality
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await authenticatedFetch(url, { method: 'GET' });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      toast.error('Download failed. Please try again.');
      console.error('Download error:', error);
    }
  };

  // Handle download all files functionality
  const handleDownloadAll = async () => {
    if (!data?.downloadUrls || data.downloadUrls.length === 0) {
      toast.error('No files to download');
      return;
    }

    
    for (let i = 0; i < data.downloadUrls.length; i++) {
      const file = data.downloadUrls[i];
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await handleDownload(file.url, file.fileName);
      } catch (error) {
        toast.error(`Failed to download ${file.fileName}`);
        console.error('Download error:', error);
      }
    }
    
    toast.success('Download completed!');
  };

  // Handle external link copy
  const handleExternalLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`${name} link copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  // Handle edit product
  const handleEdit = () => {
    // TODO: Navigate to edit product page
    toast.info('Edit functionality coming soon!');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed left-0 bottom-17 w-full backdrop-blur-3xl bg-gray-200/60 px-4 py-4">
        <div className="border rounded-lg p-4">
          <div className="mt-3 flex gap-3">
            <Button
              size='lg'
              variant="outline"
              className="flex-1 font-semibold bg-white"
              onClick={() => {
                addToCart(product);
                toast.success('Added to cart!');
              }}
            >
              <CirclePlus />
              Add to Cart
            </Button>
            <Button
              size='lg'
              className="flex-1 font-semibold"
            >
              <CreditCard />
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state - show purchase options
  if (!data) {
    return (
      <div className="fixed left-0 bottom-17 w-full backdrop-blur-3xl bg-gray-200/60 px-4 py-4">
        <div className="flex gap-3">
          <Button
            size='lg'
            variant="outline"
            className={`flex-1 font-semibold bg-white ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isInCart) {
                addToCart(product);
                toast.success('Added to cart!');
              }
            }}
            disabled={isInCart}
          >
            <ShoppingCart />
            {isInCart ? 'Added to Cart' : 'Add to Cart'}
          </Button>
          <Button
            size='lg'
            className={`flex-1 font-semibold ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isInCart) {
                addToCart(product);
                toast.success('Added to cart!');
              }
            }}
          >
            <CreditCard />
            Buy Now
          </Button>
        </div>
      </div>
    );
  }

  if (data.hasAccess || data.hasPurchased) {
    return (
      <div className="fixed left-0 bottom-15 w-full backdrop-blur-3xl bg-white px-4 pb-6">
        <div className="">
          <div className=" rounded-lg px-3 py-2">
            {data.purchaseDetails && (
              <div className="flex flex-row items-center justify-center gap-1 text-[#0ED065] text-xs mt-1 text-center">
                <DoubleTickIcon width={20} color="#0ED065" />
                <span>You have already purchased the product</span>
              </div>
            )}
          </div>

          {/* Show edit button if user is the creator */}
          {data.isCreator && (
            <div className="space-y-2">
              <Button
                size='lg'
                className="w-full font-semibold bg-blue-600 hover:bg-blue-700"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </div>
          )}

          {/* Show download and external links only if user is not the creator */}
          {!data.isCreator && (
            <>
              {data.downloadUrls && data.downloadUrls.length > 0 && (
                <div className="space-y-2">
                  <Button
                    size='lg'
                    className="w-full font-semibold"
                    onClick={handleDownloadAll}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Files ({data.downloadUrls.length})
                  </Button>
                </div>
              )}

              {/* External Links */}
              {data.externalLinks && data.externalLinks.length > 0 && (
                <div className="space-y-2">
                  {data.externalLinks.map((link, index) => (
                    <Button
                      key={index}
                      size='lg'
                      variant="default"
                      className="w-full font-semibold rounded-xl capitalize"
                      onClick={() => handleExternalLink(link.url, link.name)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Copy {link.name} Link
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // User doesn't have access - show purchase options
  return (
    <div className="fixed left-0 bottom-17 w-full backdrop-blur-3xl bg-gray-200/60 px-4 py-4">
      <div className="space-y-3">
        {/* Purchase buttons */}
        <div className="flex gap-3">
          <Button
            size='lg'
            variant="outline"
            className={`flex-1 font-semibold bg-white ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isInCart) {
                addToCart(product);
                toast.success('Added to cart!');
              }
            }}
            disabled={isInCart}
          >
            <ShoppingCart />
            {isInCart ? 'Added to Cart' : 'Add to Cart'}
          </Button>
          <Button
            size='lg'
            className={`flex-1 font-semibold ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isInCart) {
                addToCart(product);
                toast.success('Added to cart!');
              }
            }}
          >
            <CreditCard />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductAccessComponent;
