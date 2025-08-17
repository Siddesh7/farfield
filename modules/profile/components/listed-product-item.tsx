import { BASE_URL } from "@/config"
import { Product } from "@/lib/types/product"
import { toast } from "sonner"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useDeleteProduct } from "@/query/use-delete-product"
import { DeleteConfirmationModal } from "@/modules/home/components/delete-confirmation-modal"

const ListedProductItem = ({
    product
}: {
    product: Product
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const deleteProductMutation = useDeleteProduct();

    // Handle delete product
    const handleDeleteConfirm = () => {
        deleteProductMutation.mutate(product.id, {
            onSuccess: () => {
                setIsDialogOpen(false);
            },
            onError: (error) => {
                toast.error(error.message || "Failed to delete product");
            }
        });
    };

    return (
        <div className='py-5 border-b flex justify-between items-center'>
            <div className='flex gap-3 items-center'>
                <div className="relative h-[40px] w-[40px]">
                    <img
                        src={`${BASE_URL}/api/images/${product.images[0]}`}
                        alt={product.name}
                        style={{ objectFit: "cover" }}
                        className="object-cover w-full h-full rounded-sm"
                    />
                </div>
                <div className='flex gap-2 flex-col max-w-[164px] py-2'>
                    <p className='p-0 text-sm text-[#000000A3] whitespace-normal break-words'>
                        {product.name.split(' ').slice(0, 7).join(' ')}
                        {product.name.split(' ').length > 7 ? '...' : ''}
                    </p>
                </div>
            </div>
            <div className="flex flex-row gap-3 items-center">
                <p className='text-lg font-medium'>
                    {product.price === 0 ? 'Free' : `$${product.price}`}
                </p>
                <button 
                    className="border border-[#0000000A] bg-[#0000000A] rounded-sm p-1 hover:bg-[#ff000020] hover:border-red-200 transition-colors cursor-pointer"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Trash2 width={16} className="text-red-600" />
                </button>
                
                <DeleteConfirmationModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Product"
                    itemName={product.name}
                    isLoading={deleteProductMutation.isPending}
                    loadingText="Deleting..."
                />
            </div>
        </div>
    )
}

export default ListedProductItem