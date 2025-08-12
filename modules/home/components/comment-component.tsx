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
import { DoubleTickIcon } from '@/components/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
                    placeholder='Add Any Comment'
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
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : error ? (
                toast.error(error instanceof Error ? error.message : 'Failed to load comments') || null
            ) : (
                <div className='flex flex-col gap-4 max-h-96 overflow-y-auto pr-2 pt-2'>
                    {localComments.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No comments yet.</div>
                    ) : localComments.map((comment, id) => (
                        <div className='flex justify-between' key={id}>
                            <div className='flex flex-col gap-1' >
                                <div className='flex gap-1 items-center'>
                                    <Image src='/profile.jpg' alt='Profile' width={28} height={28} className='rounded-md' />
                                    <p className='p-0 text-[#000000A3]'>Saxenasaheb</p>
                                    <BuyerTag />
                                    <span className='text-xs text-gray-400 ml-2'>{formatTimeAgo(comment.createdAt)}</span>
                                </div>
                                <p className='p-o text-[#0000007A]'>{comment.comment}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                        <Ellipsis color='#0000007A' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-26 -mt-2 -mr-2">
                                    <DropdownMenuItem 
                                        onClick={() => toast.info('Report functionality coming soon')}
                                        className="text-red-600 text-sm"
                                    >
                                        Report
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
            <DoubleTickIcon width={12}/>
            Buyer
        </div>
    )
}