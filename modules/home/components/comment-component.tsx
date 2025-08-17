import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/product';
import { SendHorizontal } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/utils';
import { DoubleTickIcon } from '@/components/icons';
import { useAddProductComment, useGetProductComments } from '@/query';

const CommentComponent = ({
    product,
}: {
    product: Product
}) => {
    const [comment, setComment] = useState('');

    const { data, isLoading, error } = useGetProductComments(product.id, 1, 10);
    const { mutate: addComment, isPending } = useAddProductComment(product.id);

    console.log("data",data);
    

    const handleAddComment = () => {
        if (!comment.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }
        addComment(comment, {
            onSuccess: () => {
                setComment('');
                toast.success('Comment added successfully');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to add comment');
            },
        });
    };

    return (
        <div className="pb-8">
            <form
                className='flex my-2 border-dashed border rounded-lg'
                onSubmit={e => {
                    e.preventDefault();
                    handleAddComment();
                }}
            >
                <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Add Any Comment'
                    className='bg-fade-background text-fade flex-1 rounded-tr-none rounded-br-none placeholder:text-sm text-sm border-0 border-r border-gray-300 h-10'
                    disabled={isPending}
                />
                <Button
                    type='submit'
                    className='bg-fade-background text-[#0000007A] rounded-tl-none rounded-bl-none h-10 px-3'
                    disabled={isPending || !comment.trim()}
                >
                    {isPending ? 'Sending...' : <>Send <SendHorizontal className="w-4 h-4 ml-1" /></>}
                </Button>
            </form>

            {isLoading ? (
                <div className='text-center text-gray-400'>Loading comments...</div>
            ) : error ? (
                <div className='text-center text-red-400'>Failed to load comments</div>
            ) : (
                <div className='flex flex-col gap-4 max-h-96 overflow-y-auto pr-2 pt-2'>
                    {!data || data.length === 0 ? (
                        <div className="text-center text-gray-400">No comments yet.</div>
                    ) : data.map((commentItem) => {
                        const isBuyer = product.buyers?.some(buyer => buyer.fid === commentItem.commentorFid) || false;
                        return (
                            <div className='flex justify-between' key={commentItem._id}>
                                <div className='flex flex-col gap-1'>
                                    <div className='flex gap-1 items-center'>
                                        <div className='relative w-5 h-5'>
                                            <img
                                                src={commentItem.commentor.farcaster.pfp}
                                                alt={commentItem.commentor.farcaster.displayName}
                                                className='rounded-xs object-cover w-full h-full'
                                            />
                                        </div>
                                        <p className='p-0 text-[#000000A3]'>{commentItem.commentor.farcaster.displayName}</p>
                                        {isBuyer && (
                                            <div className='flex text-[#0B92F9] text-[10px]'>
                                                <DoubleTickIcon width={12} />
                                                Buyer
                                            </div>
                                        )}
                                        <span className='text-xs text-gray-400 ml-2'>
                                            {formatTimeAgo(commentItem.createdAt)}
                                        </span>
                                    </div>
                                    <p className='p-o text-[#0000007A]'>{commentItem.comment}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export { CommentComponent };