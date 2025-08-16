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
import { Check } from 'lucide-react';
import { WalletIcon, FileIcon, SwapIcon } from '@/components/icons';

const CartPage = () => {
    const { cart, removeFromCart, setActiveModule } = useGlobalContext();
    const { address, isConnected } = useAccount();
    const { post } = useAuthenticatedAPI();
    const { sendTransactionAsync } = useSendTransaction();

    const [loading, setLoading] = useState(false);
    const [checkoutStarted, setCheckoutStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    
    // Step states: 'pending', 'active', 'completed', 'error'
    const [stepStates, setStepStates] = useState<('pending' | 'active' | 'completed' | 'error')[]>([
        'pending', 'pending', 'pending'
    ]);

    const checkoutSteps = [
        { icon: WalletIcon, text: 'Approve USDC spending' },
        { icon: FileIcon, text: 'Sign the transaction' },
        { icon: SwapIcon, text: 'Confirm Purchase' }
    ];

    // Helper to update step state
    const updateStepState = (stepIndex: number, state: 'pending' | 'active' | 'completed' | 'error') => {
        setStepStates(prev => prev.map((s, i) => i === stepIndex ? state : s));
    };

    // Helper to get short error message (20 words max)
    const getShortErrorMessage = (error: string): string => {
        const words = error.split(' ');
        if (words.length <= 20) return error;
        return words.slice(0, 20).join(' ') + '...';
    };

    // Main checkout process
    const initiateCheckout = async () => {
        setCheckoutError(null);
        setLoading(true);
        setCheckoutStarted(true);
        setCurrentStep(0);
        
        // Reset all steps to pending
        setStepStates(['pending', 'pending', 'pending']);

        try {
            if (!isConnected || !address) {
                throw new Error('Please connect your wallet to proceed with the purchase.');
            }

            // Initiate purchase first (silent step)
            const res = await post('/api/purchase/initiate', {
                items: cart.map((product) => ({ productId: product.id })),
                buyerWallet: address,
            });
            
            const data = res.data;
            if (!data || !data.transactions || !data.purchaseId) {
                throw new Error('Failed to initiate purchase. Please try again.');
            }

            // Step 1: Approve USDC spending
            setCurrentStep(0);
            updateStepState(0, 'active');
            const requiredAmount = usdcUtils.toUnits(
                Number(data.summary.totalAmount) + Number(data.summary.platformFee)
            );
            
            const allowance = await usdcContract.getAllowance(
                address as `0x${string}`,
                FARFIELD_CONTRACT_ADDRESS as `0x${string}`
            );
            
            if (allowance < requiredAmount) {
                const approvalTx = usdcContract.generateApprovalTransaction(
                    FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
                    requiredAmount
                );
                
                await sendTransactionAsync({
                    to: approvalTx.to as `0x${string}`,
                    data: approvalTx.data,
                    value: BigInt(0),
                });
            }
            
            updateStepState(0, 'completed');

            // Step 2: Sign the transaction
            setCurrentStep(1);
            updateStepState(1, 'active');
            let lastTxHash = null;
            
            for (const tx of data.transactions) {
                if (typeof tx.to !== 'string' || !tx.to.startsWith('0x')) {
                    throw new Error('Invalid transaction data received.');
                }
                
                const txRequest: any = {
                    to: tx.to,
                    data: tx.data,
                    value: BigInt(String(tx.value ?? '0')),
                };
                
                if (tx.chainId && !isNaN(Number(tx.chainId))) {
                    txRequest.chainId = Number(tx.chainId);
                }
                
                const hash = await sendTransactionAsync(txRequest);
                lastTxHash = hash;
            }
            
            updateStepState(1, 'completed');

            // Step 3: Confirm Purchase
            setCurrentStep(2);
            updateStepState(2, 'active');
            
            // Wait 4 seconds before confirming purchase
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            const confirmRes = await post('/api/purchase/confirm', {
                purchaseId: data.purchaseId,
                transactionHash: lastTxHash,
            });
            
            if (confirmRes?.error) {
                throw new Error('Failed to confirm purchase. Contact support if payment was processed.');
            }
            
            updateStepState(2, 'completed');
            
            // Success handling
            toast.success('Purchase completed successfully!');
            
            // Clear cart
            cart.forEach((product) => removeFromCart(product.id));
            
            // Wait a moment then redirect to profile
            setTimeout(() => {
                setActiveModule('profile');
            }, 1500);

        } catch (err: any) {
            const errorMessage = getShortErrorMessage(
                err?.message || (typeof err === 'string' ? err : 'Purchase failed. Please try again.')
            );
            
            setCheckoutError(errorMessage);
            
            // Mark the current step as error (currentStep now correctly reflects the active step)
            updateStepState(currentStep, 'error');
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BoxContainer className='relative flex flex-1 flex-col pt-22 px-5.5'>
            <div className="pt-4.5 flex flex-col flex-1 gap-4 pb-28">
               {cart.length !== 0 && <p className='font-awesome text-2xl'>Your Cart</p>}
                <ScrollArea className="rounded-md flex-1 min-h-0 overflow-y-auto pr-3">
                    <div className="flex flex-col pt-4">
                        {cart.length === 0 ? (
                            <div className='flex flex-col gap-2 items-center justify-center'>
                                <h3 className="text-center font-awesome text-2xl">Your Cart is Empty</h3>
                                <p className='text-[#00000052] text-sm'>Explore the products and add to cart</p>
                                <Button 
                                    variant='outline' 
                                    className='bg-white' 
                                    size='lg'
                                    onClick={() => setActiveModule('home')}
                                >
                                    Explore Products
                                </Button>
                            </div>
                        ) : (
                            cart.map((product) => (
                                <CartListItem key={product.id} product={product} />
                            ))
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {cart.length > 0 && (
                <div className='fixed left-0 bottom-12 w-full backdrop-blur-3xl bg-gradient-to-t from-gray-300/95 to-transparent flex flex-col gap-4 p-5.5 z-10 pb-8'>
                    <div className='flex w-full justify-between items-center'>
                        <p className='text-lg font-semibold'>Total:</p>
                        <p className='text-xl font-normal'><span className='font-semibold'>$</span>{cart.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</p>
                    </div>

                    {/* Checkout Steps */}
                    {checkoutStarted && (
                        <div className="flex flex-col py-2">
                            {checkoutSteps.map((step, index) => {
                                const IconComponent = step.icon;
                                const isLastStep = index === checkoutSteps.length - 1;
                                
                                return (
                                    <div key={index} className="relative">
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 relative z-10">
                                                    <IconComponent 
                                                        width={20}
                                                        color={
                                                            stepStates[index] === 'completed' 
                                                                ? '#16a34a' 
                                                                : stepStates[index] === 'active'
                                                                ? '#2563eb'
                                                                : stepStates[index] === 'error'
                                                                ? '#dc2626'
                                                                : '#9ca3af'
                                                        }
                                                    />
                                                </div>
                                                <p className={`text-sm font-medium ${
                                                    stepStates[index] === 'completed' 
                                                        ? 'text-green-600' 
                                                        : stepStates[index] === 'active'
                                                        ? 'text-blue-600'
                                                        : stepStates[index] === 'error'
                                                        ? 'text-red-600'
                                                        : 'text-gray-500'
                                                }`}>
                                                    {step.text}
                                                </p>
                                            </div>
                                            
                                            <div className="flex-shrink-0">
                                                {stepStates[index] === 'completed' ? (
                                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                        <Check size={12} className="text-white" />
                                                    </div>
                                                ) : stepStates[index] === 'active' ? (
                                                    <LoadingSpinner size="sm" color="primary" className="w-5 h-5" />
                                                ) : stepStates[index] === 'error' ? (
                                                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                                        <span className="text-white text-xs">✕</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Vertical connector line */}
                                        {!isLastStep && (
                                            <div className="absolute left-2.5 top-8 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Button
                        size='lg'
                        disabled={loading}
                        onClick={initiateCheckout}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                Buying... <LoadingSpinner size="sm" />
                            </span>
                        ) : (
                            'Proceed to Checkout'
                        )}
                    </Button>
                </div>
            )}
        </BoxContainer>
    );
};

export { CartPage };