import React from 'react';
import { ArrowLeft, WalletMinimal } from 'lucide-react'
import { useAccount } from 'wagmi';
import { trimAddress } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '../ui';
import { useGlobalContext } from '@/context/global-context';
import Image from 'next/image';

const HeaderSection = () => {
    const { linkWallet } = usePrivy();
    const { address, isConnected } = useAccount();
    const { activeModule, selectedProduct, setActiveModule, setSelectedProduct } = useGlobalContext();

    const showBackArrow = selectedProduct && (activeModule === 'home' || activeModule === 'cart')

    if (activeModule === 'profile') return null

    return (
        
                    <div className='absolute top-0 z-99 w-full flex justify-between pt-7 px-5 items-center'>


            {showBackArrow ? <div className='bg-white rounded-xl px-3.5 py-2.5'>
                <ArrowLeft onClick={() => {
                    setActiveModule('home')
                    setSelectedProduct(null)
                }} />
            </div> : (
                <h1 className="font-awesome-italic text-2xl font-medium">
                    {(activeModule === 'home' || activeModule === 'cart' || activeModule === 'notifications') && (
                        <Image
                            src="/App_Logo.png"
                            alt='App Logo'
                            width={75}
                            height={30}
                        />
                    )}
                    {activeModule === 'add-product' && 'Add Product'}
                </h1>
            )}

            {!isConnected ? (
                <div className={`rounded-xl ${showBackArrow ? 'bg-white' : 'bg-[#0000000A]'}`}>
                    <Button
                        variant="outline"
                        className={`w-full ${showBackArrow ? 'bg-white' : 'bg-[#0000000A]'}`}
                        onClick={linkWallet}

                    >
                        Connect Wallet
                    </Button>
                </div>
            ) : (
                <div className={`flex px-3 py-2.5  rounded-xl items-center gap-1.5 ${showBackArrow ? 'bg-white' : 'bg-[#0000000A]'} `}>
                    <WalletMinimal size={16} />
                    {trimAddress(address, 5)}
                </div>
            )}
        </div>
    );
};

export default HeaderSection;