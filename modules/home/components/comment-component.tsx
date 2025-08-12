import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/product';
import { SendHorizontal } from 'lucide-react';
import React, { FC, useState } from 'react';
import { useGetProductComments, useAddProductComment, ProductComment } from '@/query/use-comment';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatTimeAgo } from '@/lib/utils';
import { DoubleTickIcon } from '@/components/icons';
import { useIsBuyer } from '@/lib/hooks';

type CommentComponentProps = {
    product: Product;
}

const CommentComponent: FC<CommentComponentProps> = ({
    product,
}) => {
    const { isBuyer, isLoading: checkingBuyer } = useIsBuyer(product);

    const [comment, setComment] = useState('');
    const [localComments, setLocalComments] = useState<ProductComment[]>([]);

    if (!product.id) {
        return <div className="text-center text-red-500">Invalid product ID</div>;
    }
    const { data, isLoading, error, refetch } = useGetProductComments(product.id, 1, 10);
    const { mutate: addComment, isPending } = useAddProductComment(product.id);

    React.useEffect(() => {
        if (data && data.data) {
            setLocalComments(data.data);
        }
    }, [data]);

    const handleAddComment = () => {
        if (!comment.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }
        addComment(comment, {
            onSuccess: (newComment) => {
                setComment('');
                toast.success('Comment added successfully');
                if (newComment) {
                    refetch();
                }
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to add comment');
            },
        });
    };

    return (
        <div className="pb-8">
            <form
                className='flex my-3 h-auto border-dashed border-3 rounded-lg'
                onSubmit={e => {
                    e.preventDefault();
                    handleAddComment();
                }}
            >
                <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isPending ? 'Adding comment...' : 'Add Any Comment'}
                    className='bg-fade-background text-fade flex-1 rounded-tr-none rounded-br-none h-auto placeholder:text-sm text-sm border-0 border-r border-gray-300'
                    disabled={isPending}
                />
                <Button
                    type='submit'
                    size='lg'
                    className='bg-fade-background text-[#0000007A] rounded-tl-none rounded-bl-none'
                    disabled={isPending || !comment.trim()}
                >
                    {isPending ? <LoadingSpinner size="sm" /> : <>Send <SendHorizontal /></>}
                </Button>
            </form>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                        <LoadingSpinner />
                        <p className="text-sm text-gray-500">Loading comments...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-500 mb-2">Failed to load comments</p>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className='flex flex-col gap-4 max-h-96 overflow-y-auto pr-2 pt-2'>
                    {localComments.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No comments yet.</div>
                    ) : localComments.map((comment) => (
                        <div className='flex justify-between' key={comment._id}>
                            <div className='flex flex-col gap-1' >
                                <div className='flex gap-1 items-center'>
                                    <div className='relative w-5 h-5'>
                                        <img
                                            src={comment.commentor?.pfp || '/profile.jpg'}
                                            alt={comment.commentor?.name}
                                            className='rounded-xs object-cover w-full h-full'
                                        />
                                    </div>
                                    <p className='p-0 text-[#000000A3]'>
                                        {comment.commentor?.name || `User ${comment.commentorFid}`}
                                    </p>
                                    {product.buyer?.some(b => b.fid === comment.commentorFid) && <BuyerTag />}
                                    <span className='text-xs text-gray-400 ml-2'>
                                        {formatTimeAgo(new Date(comment.createdAt))}
                                    </span>
                                </div>
                                <p className='p-o text-[#0000007A]'>{comment.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export { CommentComponent };

const BuyerTag = () => {
    return (
        <div className='flex text-[#0B92F9] text-[10px]'>
            <DoubleTickIcon width={12} />
            Buyer
        </div>
    )
}