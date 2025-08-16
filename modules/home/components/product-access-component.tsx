import React, { useState } from 'react';
import { Button, Skeleton } from '@/components/ui';
import { CirclePlus, Download, ExternalLink, ShoppingCart, CreditCard, Trash2 } from 'lucide-react';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { toast } from "sonner";
import { CopyIcon, DoubleTickIcon } from '@/components/icons';
import { useAuthenticatedFetch } from '@/lib/hooks/use-authenticated-fetch';
import { useProductAccess } from '@/query/use-product-access';
import { useDeleteProduct } from '@/query/use-delete-product';
import JSZip from 'jszip';

interface ProductAccessComponentProps {
  product: Product
}

const ProductAccessComponent: React.FC<ProductAccessComponentProps> = ({ product }) => {
  const { data, isLoading, error } = useProductAccess(product.id);
  const { addToCart, cart, setActiveModule, setSelectedProduct } = useGlobalContext();
  const isInCart = cart.some((p) => p.id === product.id);
  const { authenticatedFetch } = useAuthenticatedFetch();
  const deleteProductMutation = useDeleteProduct();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Handle download all files functionality (zip when multiple files)
  const handleDownloadAll = async () => {
    if (!data?.downloadUrls || data.downloadUrls.length === 0) {
      toast.error('No files to download');
      return;
    }

    try {
      if (data.downloadUrls.length > 1) {
        const zip = new JSZip();
        for (const file of data.downloadUrls) {
          const res = await authenticatedFetch(file.url, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed to fetch ${file.fileName}`);
          const arrayBuffer = await res.arrayBuffer();
          zip.file(file.fileName, arrayBuffer);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.productTitle || 'download'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Zip download started');
      } else {
        const file = data.downloadUrls[0];
        await handleDownload(file.url, file.fileName);
      }
    } catch (error) {
      toast.error('Download failed. Please try again.');
      console.error('Zip download error:', error);
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

  // Handle delete product
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setSelectedProduct(null);
        setActiveModule('home');
      },
    });
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-lg" />
          <Skeleton className="flex-1 h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
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
    );
  }

  // No data state - show purchase options
  if (!data) {
    return (
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
    );
  }

  if (data.hasAccess || data.hasPurchased) {
    return (
      <div className="">
        <div className=" rounded-lg px-3 py-2">
          {data.purchaseDetails && (
            <div className="flex flex-row items-center justify-center gap-1 text-[#0ED065] text-xs mt-1 text-center">
              <DoubleTickIcon width={20} color="#0ED065" />
              <span>You have already purchased the product</span>
            </div>
          )}
        </div>

        {/* Show delete button if user is the creator */}
        {data.isCreator && (
          <div className="space-y-2">
            {!showDeleteConfirm ? (
              <Button
                size='lg'
                variant="destructive"
                className="w-full font-semibold"
                onClick={handleDeleteClick}
                disabled={deleteProductMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete/Remove Product
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-center text-sm text-red-600 font-medium">
                  Are you sure you want to delete this product? This action cannot be undone.
                </div>
                <div className="flex gap-2">
                  <Button
                    size='sm'
                    variant="outline"
                    className="flex-1"
                    onClick={handleDeleteCancel}
                    disabled={deleteProductMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteConfirm}
                    disabled={deleteProductMutation.isPending}
                  >
                    {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            )}
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
                  Download
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
                    <CopyIcon width={16} />
                    Copy
                      <span className='lowercase'>{link.name}</span>
                    link
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // User doesn't have access - show purchase options
  return (
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
  );
};

export default ProductAccessComponent;
