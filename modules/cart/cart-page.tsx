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

const CartPage = () => {
    const { cart, removeFromCart } = useGlobalContext();
    const { address, isConnected } = useAccount();
    const { post } = useAuthenticatedAPI();
    const { sendTransactionAsync } = useSendTransaction();

    const [buyStep, setBuyStep] = useState<'idle' | 'initiating' | 'signing' | 'confirming' | 'done'>('idle');
    const [buyError, setBuyError] = useState<string | null>(null);
    const [buyTxs, setBuyTxs] = useState<any[]>([]);
    const [buyPurchaseId, setBuyPurchaseId] = useState<string | null>(null);
    const [buyFinalTxHash, setBuyFinalTxHash] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [approvalStep, setApprovalStep] = useState<'idle' | 'checking' | 'approving' | 'done'>('idle');
    const [approvalError, setApprovalError] = useState<string | null>(null);
    const [checkoutStep, setCheckoutStep] = useState<'idle' | 'initiated' | 'confirmed'>('idle');

    // Step 1: Initiate Checkout
    const initiateCheckout = async () => {
        setBuyError(null);
        setApprovalError(null);
        setBuyStep('initiating');
        setApprovalStep('idle');
        setLoading(true);
        setBuyTxs([]);
        setBuyPurchaseId(null);
        setBuyFinalTxHash(null);
        try {
            if (!isConnected || !address) {
                toast.error('Please connect your wallet to proceed.');
                setBuyStep('idle');
                setLoading(false);
                return;
            }
            // 1. Initiate purchase
            const res = await post('/api/purchase/initiate', {
                items: cart.map((product) => ({ productId: product.id })),
                buyerWallet: address,
            });
            const data = res.data;
            if (!data || !data.transactions || !data.purchaseId) {
                throw new Error(res?.error || 'Failed to initiate purchase.');
            }
            setBuyTxs(data.transactions);
            setBuyPurchaseId(data.purchaseId);
            setBuyStep('signing');

            // 2. Check USDC allowance
            setApprovalStep('checking');
            const requiredAmount = usdcUtils.toUnits(
                Number(data.summary.totalAmount) + Number(data.summary.platformFee)
            );
            const allowance = await usdcContract.getAllowance(
                address as `0x${string}`,
                FARFIELD_CONTRACT_ADDRESS as `0x${string}`
            );
            if (allowance < requiredAmount) {
                setApprovalStep('approving');
                toast('Approving USDC for purchase...');
                const approvalTx = usdcContract.generateApprovalTransaction(
                    FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
                    requiredAmount
                );
                try {
                    const hash = await sendTransactionAsync({
                        to: approvalTx.to as `0x${string}`,
                        data: approvalTx.data,
                        value: BigInt(0),
                    });
                    toast.success('USDC approved!');
                } catch (err: any) {
                    setApprovalError('USDC approval failed.');
                    toast.error('USDC approval failed.');
                    setBuyStep('idle');
                    setApprovalStep('idle');
                    setLoading(false);
                    return;
                }
            }
            setApprovalStep('done');

            // 3. Execute blockchain transactions
            let lastTxHash = null;
            for (const tx of data.transactions) {
                try {
                    if (typeof tx.to !== 'string' || !tx.to.startsWith('0x')) {
                        throw new Error('Invalid transaction recipient address.');
                    }
                    if (typeof tx.data !== 'string' || !tx.data) {
                        throw new Error('Invalid transaction data.');
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
                } catch (err: any) {
                    const message = err?.message || (typeof err === 'string' ? err : 'Transaction failed.');
                    throw new Error(message);
                }
            }
            setBuyFinalTxHash(lastTxHash);
            setBuyStep('confirming');
            setCheckoutStep('initiated');
            toast.success('Transactions sent. Please confirm purchase.');
        } catch (err: any) {
            const message = err?.message || (typeof err === 'string' ? err : 'Something went wrong.');
            setBuyError(message);
            toast.error(message);
            setBuyStep('idle');
            setApprovalStep('idle');
            setCheckoutStep('idle');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Confirm Purchase
    const confirmPurchase = async () => {
        setBuyError(null);
        setLoading(true);
        setBuyStep('confirming');
        try {
            if (!buyPurchaseId || !buyFinalTxHash) {
                throw new Error('Missing purchase information.');
            }
            const confirmRes = await post('/api/purchase/confirm', {
                purchaseId: buyPurchaseId,
                transactionHash: buyFinalTxHash,
            });
            if (confirmRes?.error) {
                throw new Error(confirmRes.error);
            }
            setBuyStep('done');
            setCheckoutStep('confirmed');
            toast.success('Purchase successful!');
            // Clear cart after successful purchase
            cart.forEach((product) => removeFromCart(product.id));
        } catch (err: any) {
            console.log("Error", err);
            const message = err?.message || (typeof err === 'string' ? err : 'Something went wrong.');
            setBuyError(message);
            toast.error(message);
            setBuyStep('idle');
            setCheckoutStep('idle');
        } finally {
            setLoading(false);
            setBuyStep('idle');
        }
    };

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

            {cart.length > 0 && (
                <div className='fixed left-0 bottom-12 w-full bg-white flex flex-col gap-4 p-5.5 z-10 pb-8'>
                    <div className='flex w-full justify-between items-center'>
                        <p className='text-lg font-semibold'>Total:</p>
                        <p className='text-xl font-normal'><span className='font-semibold'>$</span>{cart.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</p>
                    </div>
                    <Button
                        size='lg'
                        disabled={loading || (checkoutStep === 'confirmed')}
                        onClick={
                            checkoutStep === 'idle'
                                ? initiateCheckout
                                : checkoutStep === 'initiated'
                                    ? confirmPurchase
                                    : undefined
                        }
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                {(buyStep === 'initiating' && 'Initiating...') ||
                                    (buyStep === 'signing' && (approvalStep === 'checking' ? 'Checking USDC allowance...' : approvalStep === 'approving' ? 'Approving USDC...' : approvalStep === 'done' ? 'Allowance OK. Signing Transaction...' : 'Signing Transaction...')) ||
                                    (buyStep === 'confirming' && 'Confirming...') ||
                                    'Processing...'} <LoadingSpinner size="sm" /></span>
                        ) : (
                            checkoutStep === 'idle' ? 'Proceed to Checkout' :
                                checkoutStep === 'initiated' ? 'Confirm Purchase' :
                                    'Purchase Complete'
                        )}
                    </Button>
                    {buyError && <p className='text-red-500 text-center'>{buyError}</p>}
                    {approvalError && <p className='text-red-500 text-center'>{approvalError}</p>}
                </div>
            )}
        </BoxContainer>
    );
};

export { CartPage };