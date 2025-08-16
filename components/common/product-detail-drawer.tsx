"use client";

import React, { FC } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { X, Download, CircleUser, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useGetProductById } from '@/query';
import { useProductAccess } from '@/query/use-product-access';
import { CommentComponent } from '@/modules/home/components/comment-component';
import { BASE_URL } from '@/config';
import { toast } from 'sonner';
import { useAuthenticatedFetch } from '@/lib/hooks/use-authenticated-fetch';
import JSZip from 'jszip';
import { CopyIcon, DoubleTickIcon } from '@/components/icons';

interface ProductDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

const ProductDetailDrawer: FC<ProductDetailDrawerProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const { data: product, isLoading, error } = useGetProductById(productId);
  const { data: accessData, isLoading: accessLoading } = useProductAccess(productId);
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
    if (!accessData?.downloadUrls || accessData.downloadUrls.length === 0) {
      toast.error('No files to download');
      return;
    }

    try {
      if (accessData.downloadUrls.length > 1) {
        const zip = new JSZip();
        for (const file of accessData.downloadUrls) {
          const res = await authenticatedFetch(file.url, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed to fetch ${file.fileName}`);
          const arrayBuffer = await res.arrayBuffer();
          zip.file(file.fileName, arrayBuffer);
        }
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${product?.name || 'download'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Zip download started');
      } else {
        const file = accessData.downloadUrls[0];
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

  const canDownload = accessData?.hasAccess || accessData?.hasPurchased;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <DrawerTitle className="text-lg font-semibold">
              Product Details
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="py-8">
              <ErrorDisplay
                error={error instanceof Error ? error.message : 'Failed to load product'}
              />
            </div>
          ) : !product ? (
            <div className="py-8">
              <p className="text-center text-gray-500">No product data found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cover Image */}
              <div className="relative w-full h-[200px] rounded-lg overflow-hidden">
                <img
                  src={`${BASE_URL}/api/images/${product.images[0]}`}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Product Title */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              </div>

              {/* Creator Info */}
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="relative w-12 h-12">
                  <img
                    src={product.creator?.pfp || "/profile.jpg"}
                    alt={product.creator?.name || "Creator"}
                    className="rounded-full object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.creator?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-500">@{product.creator?.username || "unknown"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/USDC.jpg"
                    alt="USDC"
                    width={24}
                    height={24}
                    className="rounded-md"
                  />
                  <span className="font-semibold text-lg">${product.price}</span>
                </div>
              </div>

              {/* Category */}
              <div className="flex gap-2 bg-gray-100 w-max rounded px-3 py-1 items-center">
                <CircleUser size={16} />
                <span className="text-sm">{product.category}</span>
              </div>

              {/* Description */}
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Download/Access Section */}
              {canDownload && (
                <div className="space-y-2">
                  {/* Digital Files Download */}
                  {accessData?.downloadUrls && accessData.downloadUrls.length > 0 && (
                    <Button
                      onClick={handleDownloadAll}
                      className="w-full font-semibold bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      disabled={accessLoading}
                    >
                      {accessLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download All Contents
                        </>
                      )}
                    </Button>
                  )}

                  {/* External Links */}
                  {accessData?.externalLinks && accessData.externalLinks.length > 0 && (
                    <>
                      {accessData.externalLinks.map((link, index) => (
                        <Button
                          key={index}
                          size="lg"
                          variant="default"
                          className="w-full font-semibold"
                          onClick={() => handleExternalLink(link.url, link.name)}
                        >
                          <CopyIcon width={16} />
                          Copy
                            <span className='lowercase'>{link.name}</span>
                          link
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Purchase Status */}
              {accessData?.purchaseDetails && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <DoubleTickIcon width={20} color="#0ED065" />
                  <span className="text-sm font-medium">You have purchased this product</span>
                </div>
              )}

              {/* Buyers Section */}
              {product.buyers && product.buyers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Recent buyers:</p>
                  <div className="flex -space-x-2">
                    {product.buyers.slice(0, 5).map((buyer, idx) => (
                      <div className="relative w-8 h-8" key={idx}>
                        <img
                          src={buyer?.pfp || "/profile.jpg"}
                          alt={`Buyer ${idx + 1}`}
                          className="rounded-full border-2 border-white object-cover w-full h-full"
                          style={{ zIndex: idx }}
                        />
                      </div>
                    ))}
                    {product.buyers.length > 5 && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full border-2 border-white text-xs font-medium text-gray-600">
                        +{product.buyers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comments</h3>
                <CommentComponent product={product} />
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export { ProductDetailDrawer };