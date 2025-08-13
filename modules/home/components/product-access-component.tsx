import React from 'react';
import { useProductAccess } from '@/query/use-product-access';
import { Button } from '@/components/ui';
import { CirclePlus } from 'lucide-react';
import { useGlobalContext } from '@/context/global-context';
import { Product } from '@/lib/types/product';
import { toast } from "sonner";

interface ProductAccessComponentProps {
    product: Product
}

const ProductAccessComponent: React.FC<ProductAccessComponentProps> = ({ product }) => {
  const { data, isLoading, error } = useProductAccess(product.id);
  const { addToCart, cart } = useGlobalContext();
  const isInCart = cart.some((p) => p.id === product.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error checking access: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!data) {
    return (
        <div className="fixed left-0 bottom-12 w-full backdrop-blur-3xl bg-gray-200/60 px-4 pt-4 pb-6">
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
                <CirclePlus />
                {isInCart ? 'Added to Cart' : 'Add to Cart'}
            </Button>
            <Button
                size='lg'
                className={`flex-1 font-semibold ${isInCart ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => {
                    if (!isInCart) {
                        // addToCart(product);
                        toast.success('Added to cart!');
                    }
                }}
            >
                <CirclePlus />
                Buy Now
            </Button>
        </div>
    </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Product Access</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Access Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            data.hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {data.hasAccess ? 'Granted' : 'Denied'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Role:</span>
          <span className="text-sm text-gray-600">
            {data.isCreator ? 'Creator' : data.hasPurchased ? 'Purchaser' : 'Viewer'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Can Download:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            data.access.canDownload ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {data.access.canDownload ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Can Edit:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            data.access.canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {data.access.canEdit ? 'Yes' : 'No'}
          </span>
        </div>

        {data.purchaseDetails && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Purchase Details</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Purchase ID: {data.purchaseDetails.purchaseId}</div>
              <div>Price Paid: ${data.purchaseDetails.pricePaid}</div>
              <div>Purchased: {new Date(data.purchaseDetails.purchasedAt).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        {data.creator && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-900 mb-2">Creator</h4>
            <div className="flex items-center space-x-3">
              {data.creator.pfp && (
                <img 
                  src={data.creator.pfp} 
                  alt={data.creator.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">{data.creator.name}</div>
                <div className="text-sm text-gray-600">@{data.creator.username}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAccessComponent;
