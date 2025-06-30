import React from 'react';
import { ArrowLeft, WalletMinimal } from 'lucide-react'
import { useAccount } from 'wagmi';
import { trimAddress } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '../ui';
import { useGlobalContext } from '@/context/global-context';

const HeaderSection = () => {
    const { linkWallet } = usePrivy();
    const { address, isConnected } = useAccount();
    const { activeModule, selectedProduct, setActiveModule, setSelectedProduct } = useGlobalContext();

    const showBackArrow = selectedProduct && (activeModule === 'home' || activeModule === 'cart')

    if (activeModule === 'profile') return null

    return (
        <div className=' w-full flex justify-between pt-7 px-5 items-center '>

            {showBackArrow ? <div className='bg-white rounded-xl px-3.5 py-2.5'>
                <ArrowLeft onClick={() => {
                    setActiveModule('home')
                    setSelectedProduct(null)
                }} />
            </div> : (
                <h1 className="font-awesome-italic text-2xl font-medium">
                    {activeModule === 'home' && 'Farfield'}
                    {activeModule === 'add-product' && 'Add Product'}
                </h1>
            )}

            {!isConnected ? (
                <div>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={linkWallet}
                    >
                        Connect Wallet
                    </Button>
                </div>
            ) : (
                <div className='flex px-3 py-2.5 bg-[#0000000A] rounded-xl items-center gap-1.5'>
                    <WalletMinimal size={16} />
                    {trimAddress(address, 5)}
                </div>
            )}
        </div>
    );
};

export default HeaderSection;