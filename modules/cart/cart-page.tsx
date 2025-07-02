import React, { useState } from 'react';
import { BoxContainer } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CartListItem } from './components/cart-list-item';
import { useGlobalContext } from '@/context/global-context';
import { useAccount, useSendTransaction } from 'wagmi';
import { useAuthenticatedAPI } from '@/lib/hooks/use-authenticated-fetch';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usdcContract, usdcUtils, FARFIELD_CONTRACT_ADDRESS } from '@/lib/blockchain';
import { PurchaseModal } from './components/purchase-modal';

const CartPage = () => {
    const { cart, removeFromCart } = useGlobalContext();
    const { address, isConnected } = useAccount();
    const { post } = useAuthenticatedAPI();
    const { sendTransactionAsync } = useSendTransaction();

    // Modal open state
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <BoxContainer className='relative flex flex-1 flex-col pt-22 px-5.5'>
            <div className="pt-4.5 flex flex-col flex-1 gap-4 pb-28">
                <p className='font-awesome text-2xl'>Your Cart</p>
                <ScrollArea className="rounded-md flex-1 min-h-0 overflow-y-auto pr-3">
                    <div className="flex flex-col pt-4">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Your cart is empty.</p>
                        ) : (
                            cart.map((product) => (
                                <CartListItem key={product.id} product={product} />
                            ))
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            <div className='fixed left-0 bottom-12 w-full bg-white flex flex-col gap-4 p-5.5 z-10 pb-8'>
                <div className='flex w-full justify-between items-center'>
                    <p className='text-lg font-semibold'>Total:</p>
                    <p className='text-xl font-normal'><span className='font-semibold'>$</span>{cart.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</p>
                </div>
                <Button
                    size='lg'
                    disabled={cart.length === 0 || modalOpen}
                    onClick={() => setModalOpen(true)}
                >
                    Proceed to Checkout
                </Button>
            </div>
            <PurchaseModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                cart={cart}
                address={address}
                isConnected={isConnected}
                post={post}
                sendTransactionAsync={sendTransactionAsync}
                removeFromCart={removeFromCart}
            />
        </BoxContainer>
    );
};

export { CartPage };