import Image from 'next/image';
import React from 'react';
import { LoadingSpinner } from '../ui';

const Loadinglayout = () => {
    return (
        <div className='flex bg-black flex-col items-center justify-center min-h-screen'>

            <div>
                <Image
                    src="/logo.png"
                    alt='FarField'
                    width={140}
                    height={140}
                />
            </div>

            <div className='fixed bottom-12'>
                <LoadingSpinner color='secondary' className="mx-auto mb-4" />
                <p className='font-awesome text-3xl text-white'>$ell, Earn & Explore</p>
            </div>


        </div>
    );
};

export default Loadinglayout;