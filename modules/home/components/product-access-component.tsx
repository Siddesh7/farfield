import React from 'react';
import { useProductAccess } from '@/query/use-product-access';
import { Button } from '@/components/ui';
import { CirclePlus, Download, ExternalLink, ShoppingCart, CreditCard } from 'lucide-react';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { toast } from "sonner";
import { DoubleTickIcon } from '@/components/icons';

interface ProductAccessComponentProps {
  product: Product
}

const ProductAccessComponent: React.FC<ProductAccessComponentProps> = ({ product }) => {
  const { data, isLoading, error } = useProductAccess(product.id);
  const { addToCart, cart } = useGlobalContext();
  const isInCart = cart.some((p) => p.id === product.id);

  // Handle download functionality
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
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

  // Handle external link copy
  const handleExternalLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`${name} link copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
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
      <div className="fixed left-0 bottom-15 w-full px-4 pt-4 pb-6">
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
      <div className="fixed left-0 bottom-15 w-full backdrop-blur-3xl bg-gray-200/60 px-4 pt-4 pb-6">
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

          {/* Download URLs */}
          {data.downloadUrls && data.downloadUrls.length > 0 && (
            <div className="space-y-2">
              {data.downloadUrls.map((file, index) => (
                <Button
                  key={index}
                  size='lg'
                  className="w-full text capitalize font-semibold bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleDownload(file.url, file.fileName)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {file.fileName}
                  {file.fileSize && (
                    <span className="ml-2 text-xs opacity-80">
                      ({(file.fileSize / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </Button>
              ))}
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

          {/* Preview Files (if available and user has access) */}
          {data.previewFiles && data.previewFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 font-medium">Preview Files:</div>
              {data.previewFiles.map((file, index) => (
                <Button
                  key={index}
                  size='sm'
                  variant="outline"
                  className="w-full text-sm bg-gray-50"
                  onClick={() => handleDownload(file.url, file.fileName)}
                >
                  <Download className="mr-2 h-3 w-3" />
                  Preview: {file.fileName}
                </Button>
              ))}
            </div>
          )}

          {/* Preview Links (if available and user has access) */}
          {data.previewLinks && data.previewLinks.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 font-medium">Preview Links:</div>
              {data.previewLinks.map((link, index) => (
                <Button
                  key={index}
                  size='sm'
                  variant="outline"
                  className="w-full text-sm bg-gray-50"
                  onClick={() => handleExternalLink(link.url, link.name)}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Preview: {link.name}
                </Button>
              ))}
            </div>
          )}

          {/* No download content available */}
          {(!data.downloadUrls || data.downloadUrls.length === 0) &&
            (!data.externalLinks || data.externalLinks.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-yellow-800 text-sm">
                  Access granted but no download content available yet.
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // User doesn't have access - show purchase options
  return (
    <div className="fixed left-0 bottom-15 w-full backdrop-blur-3xl bg-gray-200/60 px-4 pt-4 pb-6">
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
