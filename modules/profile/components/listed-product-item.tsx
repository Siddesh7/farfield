import { BASE_URL } from "@/config"
import { Product } from "@/lib/types/product"
import { toast } from "sonner"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useDeleteProduct } from "@/query/use-delete-product"
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
                toast.success("Product deleted successfully");
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
                <p className='text-lg font-medium'>${product.price}</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button 
                            className="border border-[#0000000A] bg-[#0000000A] rounded-sm p-1 hover:bg-[#ff000020] hover:border-red-200 transition-colors cursor-pointer"
                        >
                            <Trash2 width={16} className="text-red-600" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delete Product</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={deleteProductMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={deleteProductMutation.isPending}
                            >
                                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

export default ListedProductItem