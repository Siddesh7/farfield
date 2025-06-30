import React from 'react';
import { BoxContainer } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CartListItem } from './components/cart-list-item';
import { useGlobalContext } from '@/context/global-context';

const CartPage = () => {
    const { cart } = useGlobalContext();
    return (
        <BoxContainer className='relative flex flex-1'>
            <div className="flex flex-col flex-1 justify-between">
                <div className="pt-4.5 flex flex-col flex-1 gap-4 px-5">
                    <p className='font-awesome text-2xl'>Your Cart</p>
                    <ScrollArea className="rounded-md flex-1 min-h-0 overflow-y-auto pr-3">
                        <div className="flex flex-col pt-4">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">Your cart is empty.</p>
                            ) : (
                                cart.map((product) => (
                                    <CartListItem key={product._id} product={product} />
                                ))
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                <div className='bg-white w-full flex flex-col gap-4 p-5.5 z-10'>
                    <div className='flex w-full justify-between items-center'>
                        <p className='text-lg'>Total:</p>
                        <p className='text-xl'>${cart.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</p>
                    </div>
                    <Button size='lg' disabled={cart.length === 0}>Proceed to Checkout</Button>
                </div>

            </div>


        </BoxContainer>
    );
};

export { CartPage };