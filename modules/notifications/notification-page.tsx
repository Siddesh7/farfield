import { BoxContainer } from '@/components/common';
import { ListFilter } from 'lucide-react';
import React from 'react';

const NotificationPage = () => {
    return (
        <BoxContainer className='relative flex flex-1 flex-col pt-22 px-5.5'>
            <div className="pt-4.5 flex gap-4 justify-between">
                <p className='font-awesome text-2xl'>Notifications</p>
                <div className='bg-fade-background py-3 px-3.5 rounded-lg'>
                    <ListFilter size={16} />
                </div>
            </div>

        </BoxContainer>
    );
};

export default NotificationPage;