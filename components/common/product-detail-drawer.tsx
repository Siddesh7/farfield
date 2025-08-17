"use client";

import React, { FC, useState } from 'react';
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
import { X, Download, Check } from 'lucide-react';
import { useGetProductById, useSubmitRating } from '@/query';
import { useProductAccess } from '@/query/use-product-access';
import { CommentComponent } from '@/modules/home/components/comment-component';
import { BASE_URL } from '@/config';
import { toast } from 'sonner';
import { useAuthenticatedFetch } from '@/lib/hooks/use-authenticated-fetch';
import JSZip from 'jszip';
import { CopyIcon, DoubleTickIcon, StarIcon } from '@/components/icons';

import Image from 'next/image';

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
  const submitRatingMutation = useSubmitRating();

  // Rating state
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // Download and copy states
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<Set<number>>(new Set());

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
        setIsDownloaded(true);
      } else {
        const file = accessData.downloadUrls[0];
        await handleDownload(file.url, file.fileName);
        setIsDownloaded(true);
      }
    } catch (error) {
      toast.error('Download failed. Please try again.');
      console.error('Zip download error:', error);
    }
  };

  // Handle external link copy
  const handleExternalLink = (url: string, name: string, index: number) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLinks(prev => new Set(prev).add(index));
      
      // Reset the copied state after 1 second
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 1000);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  // Handle rating submission
  const handleRatingSubmit = (rating: number) => {
    if (!product || submitRatingMutation.isPending) return;

    submitRatingMutation.mutate(
      { productId: product.id, rating },
      {
        onSuccess: () => {
          setSelectedRating(rating);
        },
      }
    );
  };

  const canDownload = accessData?.hasAccess || accessData?.hasPurchased;
  
  // Show verified icon if the product creator is verified
  const shouldShowVerifiedIcon = product?.creator.isVerified;

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

        <div className="flex-1 overflow-y-auto px-4 pb-20">
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

              <div className='flex gap-2 bg-fade-background w-max px-1.5 py-1 rounded-md items-center border border-[#0000000A]'>
                <div className='relative w-5 h-5'>
                  <img
                    src={product.creator?.pfp}
                    alt={product.creator?.name}
                    className='rounded-xs object-cover w-full h-full'
                  />
                </div>
                <p className='p-0 text-sm text-[#000000A3]'>{product.creator.username}</p>
                {shouldShowVerifiedIcon && (
                  <Image
                    src="/verified.jpg"
                    alt='Verified Icon'
                    width={16}
                    height={16}
                  />
                )}
              </div>

              {/* Rating Section */}
              {canDownload && !accessData?.isCreator && (
                <div className="space-y-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#000000E0] m-0">Liked it? Give it a rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingSubmit(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        disabled={submitRatingMutation.isPending || selectedRating > 0}
                        className={`transition-all duration-200 ${submitRatingMutation.isPending || selectedRating > 0
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer hover:scale-110'
                          }`}
                      >
                        <StarIcon
                          width={20}
                          isActive={
                            selectedRating > 0
                              ? star <= selectedRating
                              : star <= (hoveredRating || 0)
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-4">
                <CommentComponent product={product} />
              </div>
            </div>
          )}
        </div>

        {/* Fixed Download/Access Section at Bottom */}
        {canDownload && (
          <div className="backdrop-blur-3xl bg-gradient-to-t from-gray-300/95 to-transparent border-t p-4 space-y-3">
            {/* Digital Files Download */}
            {accessData?.downloadUrls && accessData.downloadUrls.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                className="w-full font-semibold"
                size="lg"
                disabled={accessLoading || isDownloaded}
              >
                {accessLoading ? (
                  <LoadingSpinner size="sm" />
                ) : isDownloaded ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            )}

            {/* External Links */}
            {accessData?.externalLinks && accessData.externalLinks.length > 0 && (
              <>
                {accessData.externalLinks.map((link, index) => {
                  const isCopied = copiedLinks.has(index);
                  return (
                    <Button
                      key={index}
                      size="lg"
                      variant="default"
                      className="w-full font-semibold"
                      onClick={() => handleExternalLink(link.url, link.name, index)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                          <span className='lowercase'>{link.type}</span>
                          link
                        </>
                      ) : (
                        <>
                          <CopyIcon width={16} />
                          Copy
                          <span className='lowercase'>{link.type}</span>
                          link
                        </>
                      )}
                    </Button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export { ProductDetailDrawer };