import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/product';
import { Ellipsis, SendHorizontal } from 'lucide-react';
import Image from 'next/image';
import React, { FC, useState } from 'react';
import { useGetProductComments, useAddProductComment } from '@/query/use-comment';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatTimeAgo } from '@/lib/utils';

type CommentComponentProps = {
    product: Product;
    user_comments: Product['comments']
}

const CommentComponent: FC<CommentComponentProps> = ({
    product,
    user_comments
}) => {
    const [comment, setComment] = useState('');
    const [localComments, setLocalComments] = useState(user_comments || []);

    if (!product.id) {
        return <div className="text-center text-red-500">Invalid product ID</div>;
    }
    const { data, isLoading, error, refetch } = useGetProductComments(product.id, 1, 10);
    const { mutate: addComment, isPending } = useAddProductComment(product.id);

    console.log("data", data);

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
                    setLocalComments((prev) => [newComment, ...prev]);
                }
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to add comment');
            },
        });
    };

    return (
        <>
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
                    placeholder='Add Any Comment'
                    className='bg-fade-background text-fade flex-1 rounded-tr-none rounded-br-none h-auto'
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
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : error ? (
                toast.error(error instanceof Error ? error.message : 'Failed to load comments') || null
            ) : (
                <div className='flex flex-col gap-4 pb-16'>
                    {localComments.length === 0 ? (
                        <div className="text-center text-gray-400">No comments yet.</div>
                    ) : localComments.map((comment, id) => (
                        <div className='flex justify-between' key={id}>
                            <div className='flex flex-col gap-1' >
                                <div className='flex gap-1 items-center'>
                                    <Image src='/profile.jpg' alt='Profile' width={28} height={28} className='rounded-md' />
                                    <p className='p-0 text-[#000000A3]'>Saxenasaheb</p>
                                    <span className='text-xs text-gray-400 ml-2'>{formatTimeAgo(comment.createdAt)}</span>
                                </div>
                                <p className='p-o text-[#0000007A]'>{comment.comment}</p>
                            </div>
                            <Ellipsis color='#0000007A' />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export { CommentComponent };