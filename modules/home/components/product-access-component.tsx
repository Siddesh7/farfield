import React, { useState } from 'react';
import { Button, Skeleton } from '@/components/ui';
import { CirclePlus, Download, ShoppingCart, CreditCard, Trash2, Check } from 'lucide-react';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { toast } from "sonner";
import { CopyIcon, DoubleTickIcon, WalletIcon, FileIcon, SwapIcon } from '@/components/icons';
import { useAuthenticatedFetch } from '@/lib/hooks/use-authenticated-fetch';
import { useProductAccess } from '@/query/use-product-access';
import { useDeleteProduct } from '@/query/use-delete-product';
import { usePurchaseConfirm } from '@/query/use-purchase-confirm';
import { useAuthenticatedAPI } from '@/lib/hooks/use-authenticated-fetch';
import { useAccount, useSendTransaction } from 'wagmi';
import { usdcContract, usdcUtils, FARFIELD_CONTRACT_ADDRESS, CHAIN_ID } from '@/lib/blockchain';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BASE_URL, wagmiConfig } from '@/config';
import { useMiniApp } from '@/providers/provider';

interface ProductAccessComponentProps {
  product: Product
}

const ProductAccessComponent: React.FC<ProductAccessComponentProps> = ({ product }) => {
  const { data, isLoading, error, refetch } = useProductAccess(product.id);
  const { addToCart, cart, setActiveModule, setSelectedProduct, removeFromCart } = useGlobalContext();
  const isInCart = cart.some((p) => p.id === product.id);
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { post } = useAuthenticatedAPI();
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction({config: wagmiConfig});
  const deleteProductMutation = useDeleteProduct();
  const purchaseConfirmMutation = usePurchaseConfirm();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { actions: sdkActions } = useMiniApp();
  
  // Buy Now state management
  const [loading, setLoading] = useState(false);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  // Step states: 'pending', 'active', 'completed', 'error'
  const [stepStates, setStepStates] = useState<('pending' | 'active' | 'completed' | 'error')[]>([
    'pending', 'pending', 'pending'
  ]);

  const checkoutSteps = [
    { icon: WalletIcon, text: product.price === 0 ? 'Getting free product' : 'Approve USDC spending' },
    { icon: FileIcon, text: 'Sign the transaction' },
    { icon: SwapIcon, text: 'Confirm Purchase' }
  ];

  // Helper to update step state
  const updateStepState = (stepIndex: number, state: 'pending' | 'active' | 'completed' | 'error') => {
    setStepStates(prev => prev.map((s, i) => i === stepIndex ? state : s));
  };

  // Helper to get short error message (20 words max)
  const getShortErrorMessage = (error: string): string => {
    const words = error.split(' ');
    if (words.length <= 20) return error;
    return words.slice(0, 20).join(' ') + '...';
  };

  // Main buy now checkout process
  const initiateBuyNow = async () => {
    setCheckoutError(null);
    setLoading(true);
    setCheckoutStarted(true);
    setCurrentStep(0);
    
    // Reset all steps to pending
    setStepStates(['pending', 'pending', 'pending']);

    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet to proceed with the purchase.');
      }

      // Initiate purchase first (silent step)
      const res = await post('/api/purchase/initiate', {
        items: [{ productId: product.id }],
        buyerWallet: address,
      });
      
      const data = res.data;
      if (!data || !data.transactions || !data.purchaseId) {
        throw new Error('Failed to initiate purchase. Please try again.');
      }

      // Step 1: Approve USDC spending (or skip for free products)
      setCurrentStep(0);
      updateStepState(0, 'active');
      
      if (product.price > 0) {
        const requiredAmount = usdcUtils.toUnits(
          Number(data.summary.totalAmount) + Number(data.summary.platformFee)
        );
        
        const allowance = await usdcContract.getAllowance(
          address as `0x${string}`,
          FARFIELD_CONTRACT_ADDRESS as `0x${string}`
        );
        
        if (allowance < requiredAmount) {
          const approvalTx = usdcContract.generateApprovalTransaction(
            FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
            requiredAmount
          );
          
          await sendTransactionAsync({
            to: approvalTx.to as `0x${string}`,
            data: approvalTx.data,
            value: BigInt(0),
            chainId: CHAIN_ID
          });
        }
      }
      
      updateStepState(0, 'completed');

      // Step 2: Sign the transaction
      setCurrentStep(1);
      updateStepState(1, 'active');
      let lastTxHash = null;
      
      for (const tx of data.transactions) {
        if (typeof tx.to !== 'string' || !tx.to.startsWith('0x')) {
          throw new Error('Invalid transaction data received.');
        }
        
        const txRequest: any = {
          to: tx.to,
          data: tx.data,
          value: BigInt(String(tx.value ?? '0')),
        };
        
        if (tx.chainId && !isNaN(Number(tx.chainId))) {
          txRequest.chainId = Number(tx.chainId);
        }
        
        const hash = await sendTransactionAsync(txRequest);
        lastTxHash = hash;
      }
      
      updateStepState(1, 'completed');

      // Step 3: Confirm Purchase
      setCurrentStep(2);
      updateStepState(2, 'active');
      
      // Wait 2 seconds before confirming purchase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!lastTxHash) {
        throw new Error('Transaction hash is missing');
      }
      
      const confirmResult = await purchaseConfirmMutation.mutateAsync({
        purchaseId: data.purchaseId,
        transactionHash: lastTxHash,
      });
      
      updateStepState(2, 'completed');
      
      // Success handling
      toast.success('Purchase completed successfully!');
      
      // Remove from cart if it was there
      if (isInCart) {
        removeFromCart(product.id);
      }
      
      // Refetch product access to update UI
      await refetch();
      
      // Reset checkout state after a delay
      setTimeout(() => {
        setCheckoutStarted(false);
        setLoading(false);
        setStepStates(['pending', 'pending', 'pending']);
        setCurrentStep(0);
      }, 2000);

    } catch (err: any) {
      const errorMessage = getShortErrorMessage(
        err?.message || (typeof err === 'string' ? err : 'Purchase failed. Please try again.')
      );
      
      setCheckoutError(errorMessage);
      
      const activeStepIndex = stepStates.findIndex(state => state === 'active');
      if (activeStepIndex !== -1) {
        updateStepState(activeStepIndex, 'error');
      } else {
        updateStepState(currentStep, 'error');
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Handle download functionality
  const handleDownload = () => {
    if (!data?.downloadUrls || data.downloadUrls.length === 0) {
      toast.error('No files to download');
      return;
    }

    const currentUrl = BASE_URL || window.location.origin;

    // For Farcaster mini app, we need to open downloads in a new browser window
    // because iframe restrictions prevent direct downloads
    if (data.downloadUrls.length === 1) {
      // Single file - open directly
      const downloadUrl = `${currentUrl}${data.downloadUrls[0].url}`;
      
      if (sdkActions?.openUrl) {
        sdkActions.openUrl(downloadUrl);
        toast.success('Opening download in browser...');
      } else {
        try {
          const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
          if (!newWindow) {
            window.location.href = downloadUrl;
          }
          toast.success('Opening download...');
        } catch (error) {
          window.location.href = downloadUrl;
          toast.success('Redirecting to download...');
        }
      }
    } else {
      // Multiple files - open each in sequence with small delay
      data.downloadUrls.forEach((file, index) => {
        const downloadUrl = `${currentUrl}${file.url}`;
        
        setTimeout(() => {
          if (sdkActions?.openUrl) {
            sdkActions.openUrl(downloadUrl);
          } else {
            try {
              window.open(downloadUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
              window.location.href = downloadUrl;
            }
          }
        }, index * 1000); // 1 second delay between each download
      });
      
      toast.success(`Opening ${data.downloadUrls.length} files for download...`);
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
            onClick={initiateBuyNow}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                {product.price === 0 ? 'Getting...' : 'Buying...'} <LoadingSpinner size="sm" />
              </span>
            ) : (
              <>
                <CreditCard />
                {product.price === 0 ? 'Get Free' : 'Buy Now'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // No data state - show purchase options
  if (!data) {
    return (
      <div className="space-y-3">
        {/* Checkout Steps */}
        {checkoutStarted && (
          <div className="flex flex-col py-2">
            {checkoutSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isLastStep = index === checkoutSteps.length - 1;
              
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 relative z-10">
                        <IconComponent 
                          width={20}
                          color={
                            stepStates[index] === 'completed' 
                              ? '#16a34a' 
                              : stepStates[index] === 'active'
                              ? '#2563eb'
                              : stepStates[index] === 'error'
                              ? '#dc2626'
                              : '#9ca3af'
                          }
                        />
                      </div>
                      <p className={`text-sm font-medium ${
                        stepStates[index] === 'completed' 
                          ? 'text-green-600' 
                          : stepStates[index] === 'active'
                          ? 'text-blue-600'
                          : stepStates[index] === 'error'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {step.text}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {stepStates[index] === 'completed' ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      ) : stepStates[index] === 'active' ? (
                        <LoadingSpinner size="sm" color="primary" className="w-5 h-5" />
                      ) : stepStates[index] === 'error' ? (
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs">✕</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-300" />
                      )}
                    </div>
                  </div>
                  
                  {/* Vertical connector line */}
                  {!isLastStep && (
                    <div className="absolute left-2.5 top-8 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
            disabled={isInCart || loading}
          >
            <ShoppingCart />
            {isInCart ? 'Added to Cart' : 'Add to Cart'}
          </Button>
          <Button
            size='lg'
            className="flex-1 font-semibold"
            onClick={initiateBuyNow}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                {product.price === 0 ? 'Getting...' : 'Buying...'} <LoadingSpinner size="sm" />
              </span>
            ) : (
              <>
                <CreditCard />
                {product.price === 0 ? 'Get Free' : 'Buy Now'}
              </>
            )}
          </Button>
        </div>
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
            <Button
              size='lg'
              variant="destructive"
              className="w-full font-semibold"
              onClick={handleDeleteClick}
              disabled={deleteProductMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
                  onClick={handleDownload}
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
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          description="This action cannot be undone. All sales data and customer access will be permanently removed."
          itemName={product.name}
          isLoading={deleteProductMutation.isPending}
          loadingText="Deleting product..."
        />
      </div>
    );
  }

  // User doesn't have access - show purchase options
  return (
    <div className="space-y-3">
      {/* Checkout Steps */}
      {checkoutStarted && (
        <div className="flex flex-col py-2">
          {checkoutSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isLastStep = index === checkoutSteps.length - 1;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 relative z-10">
                      <IconComponent 
                        width={20}
                        color={
                          stepStates[index] === 'completed' 
                            ? '#16a34a' 
                            : stepStates[index] === 'active'
                            ? '#2563eb'
                            : stepStates[index] === 'error'
                            ? '#dc2626'
                            : '#9ca3af'
                        }
                      />
                    </div>
                    <p className={`text-sm font-medium ${
                      stepStates[index] === 'completed' 
                        ? 'text-green-600' 
                        : stepStates[index] === 'active'
                        ? 'text-blue-600'
                        : stepStates[index] === 'error'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {step.text}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {stepStates[index] === 'completed' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    ) : stepStates[index] === 'active' ? (
                      <LoadingSpinner size="sm" color="primary" className="w-5 h-5" />
                    ) : stepStates[index] === 'error' ? (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-xs">✕</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
                
                {/* Vertical connector line */}
                {!isLastStep && (
                  <div className="absolute left-2.5 top-8 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
          disabled={isInCart || loading}
        >
          <ShoppingCart />
          {isInCart ? 'Added to Cart' : 'Add to Cart'}
        </Button>
        <Button
          size='lg'
          className="flex-1 font-semibold"
          onClick={initiateBuyNow}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              {product.price === 0 ? 'Getting...' : 'Buying...'} <LoadingSpinner size="sm" />
            </span>
          ) : (
            <>
              <CreditCard />
              {product.price === 0 ? 'Get Free' : 'Buy Now'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductAccessComponent;
