import React from 'react';
import { WalletMinimal } from 'lucide-react'
import { useAccount } from 'wagmi';
import { trimAddress } from '@/lib/utils';

const HeaderSection = () => {

    const { address } = useAccount();

    return (
        <div className='flex justify-between pt-7 px-5 items-center'>
            <h1 className="font-awesome-italic text-2xl font-medium">Farfield</h1>
            <div className='flex px-3 py-2.5 bg-[#0000000A] rounded-xl items-center gap-1.5'>
                <WalletMinimal size={16} />
                {trimAddress(address, 5)}
            </div>
        </div>
    );
};

export default HeaderSection;