import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/product';
import { Ellipsis, SendHorizontal } from 'lucide-react';
import Image from 'next/image';
import React, { FC } from 'react';

type CommentComponentProps = {
    comment: string;
    setComment: (comment: string) => void;
    user_comments: Product['comments']
}

const CommentComponent: FC<CommentComponentProps> = ({
    comment,
    setComment,
    user_comments
}) => {
    return (
        <>
            <div className='flex my-3 h-auto border-dashed border-3 rounded-lg'>
                <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Add Any Comment'
                    className='bg-fade-background text-[#000000A3] flex-1 rounded-tr-none rounded-br-none h-auto'
                />
                <Button size='lg' className='bg-fade-background text-fade rounded-tl-none rounded-bl-none'> Send <SendHorizontal /> </Button>
            </div>

            <div className='flex flex-col gap-4 pb-16'>
                {user_comments.map((comment, id) => (
                    <div className='flex justify-between' key={id}>
                        <div className='flex flex-col gap-1' >
                            <div className='flex gap-1 items-center'>
                                <Image src='/profile.jpg' alt='Profile' width={28} height={28} className='rounded-md' />
                                <p className='p-0 text-[#000000A3]'>Saxenasaheb</p>
                            </div>
                            <p className='p-o text-fade'>{comment.comment}</p>
                        </div>
                        <Ellipsis color='#0000007A' />
                    </div>
                ))}
            </div>
        </>
    );
};

export { CommentComponent };