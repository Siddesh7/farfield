import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { toast } from 'sonner';
import { usdcContract, usdcUtils, FARFIELD_CONTRACT_ADDRESS } from '@/lib/blockchain';

interface PurchaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: any[];
    address: string | undefined;
    isConnected: boolean;
    post: any;
    sendTransactionAsync: any;
    removeFromCart: (id: string) => void;
}

type StepStatus = 'pending' | 'loading' | 'done' | 'error';

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
    open,
    onOpenChange,
    cart,
    address,
    isConnected,
    post,
    sendTransactionAsync,
    removeFromCart,
}) => {
    // Stepper state
    const [step, setStep] = useState(0);
    const [steps, setSteps] = useState([
        { label: 'Initiate Purchase', status: 'pending' as StepStatus },
        { label: 'Approve USDC', status: 'pending' as StepStatus },
        { label: 'Send Transactions', status: 'pending' as StepStatus },
        { label: 'Confirm Purchase', status: 'pending' as StepStatus },
    ]);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [purchaseId, setPurchaseId] = useState<string | null>(null);
    const [finalTxHash, setFinalTxHash] = useState<string | null>(null);
    const [allowanceNeeded, setAllowanceNeeded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    // Reset state on open/close
    useEffect(() => {
        if (!open) {
            setStep(0);
            setSteps([
                { label: 'Initiate Purchase', status: 'pending' },
                { label: 'Approve USDC', status: 'pending' },
                { label: 'Send Transactions', status: 'pending' },
                { label: 'Confirm Purchase', status: 'pending' },
            ]);
            setError(null);
            setTransactions([]);
            setPurchaseId(null);
            setFinalTxHash(null);
            setAllowanceNeeded(false);
            setLoading(false);
            setSummary(null);
        }
    }, [open]);

    // Step 1: Initiate Purchase
    const handleInitiate = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: 'loading' } : s));
        try {
            if (!isConnected || !address) {
                throw new Error('Please connect your wallet to proceed.');
            }
            const res = await post('/api/purchase/initiate', {
                items: cart.map((product) => ({ productId: product.id })),
                buyerWallet: address,
            });
            const data = res.data;
            if (!data || !data.transactions || !data.purchaseId) {
                throw new Error(res?.error || 'Failed to initiate purchase.');
            }
            setTransactions(data.transactions);
            setPurchaseId(data.purchaseId);
            setSummary(data.summary);
            setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: 'done' } : s));
            setStep((s) => s + 1);
        } catch (err: any) {
            setError(err?.message || 'Failed to initiate purchase.');
            setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: 'error' } : s));
        } finally {
            setLoading(false);
        }
    }, [isConnected, address, cart, post]);

    // Step 2: Approve USDC (if needed)
    const handleApprove = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, status: 'loading' } : s));
        try {
            const requiredAmount = usdcUtils.toUnits(
                Number(summary.totalAmount) + Number(summary.platformFee)
            );
            const allowance = await usdcContract.getAllowance(
                address as `0x${string}`,
                FARFIELD_CONTRACT_ADDRESS as `0x${string}`
            );
            if (allowance < requiredAmount) {
                setAllowanceNeeded(true);
                const approvalTx = usdcContract.generateApprovalTransaction(
                    FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
                    requiredAmount
                );
                await sendTransactionAsync({
                    to: approvalTx.to as `0x${string}`,
                    data: approvalTx.data,
                    value: BigInt(0),
                });
            } else {
                setAllowanceNeeded(false);
            }
            setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, status: 'done' } : s));
            setStep((s) => s + 1);
        } catch (err: any) {
            setError(err?.message || 'USDC approval failed.');
            setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, status: 'error' } : s));
        } finally {
            setLoading(false);
        }
    }, [address, summary, sendTransactionAsync]);

    // Step 3: Send Transactions
    const handleSendTxs = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, status: 'loading' } : s));
        try {
            let lastTxHash = null;
            for (const tx of transactions) {
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
            }
            setFinalTxHash(lastTxHash);
            setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, status: 'done' } : s));
            setStep((s) => s + 1);
        } catch (err: any) {
            setError(err?.message || 'Transaction failed.');
            setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, status: 'error' } : s));
        } finally {
            setLoading(false);
        }
    }, [transactions, sendTransactionAsync]);

    // Step 4: Confirm Purchase
    const handleConfirm = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSteps((prev) => prev.map((s, i) => i === 3 ? { ...s, status: 'loading' } : s));
        try {
            await new Promise((res) => setTimeout(res, 2000));
            if (!purchaseId || !finalTxHash) {
                throw new Error('Missing purchase information.');
            }
            const confirmRes = await post('/api/purchase/confirm', {
                purchaseId,
                transactionHash: finalTxHash,
            });
            if (confirmRes?.error) {
                throw new Error(confirmRes.error);
            }
            setSteps((prev) => prev.map((s, i) => i === 3 ? { ...s, status: 'done' } : s));
            toast.success('Purchase successful!');
            cart.forEach((product) => removeFromCart(product.id));
            setTimeout(() => {
                onOpenChange(false);
            }, 1200);
        } catch (err: any) {
            setError(err?.message || 'Failed to confirm purchase.');
            setSteps((prev) => prev.map((s, i) => i === 3 ? { ...s, status: 'error' } : s));
        } finally {
            setLoading(false);
        }
    }, [purchaseId, finalTxHash, post, cart, removeFromCart, onOpenChange]);

    // Stepper logic
    useEffect(() => {
        if (!open) return;
        if (step === 0) handleInitiate();
        if (step === 1) handleApprove();
        if (step === 2) handleSendTxs();
        if (step === 3) handleConfirm();
    }, [step, open, handleInitiate, handleApprove, handleSendTxs, handleConfirm]);

    // Hide "Approve USDC" step if not needed
    useEffect(() => {
        if (step > 0 && !allowanceNeeded) {
            setSteps((prev) => prev.filter((_, i) => i !== 1));
        }
    }, [allowanceNeeded, step]);

    // Retry logic
    const handleRetry = () => {
        setError(null);
        setSteps((prev) => prev.map((s, i) => i === step ? { ...s, status: 'pending' } : s));
        setLoading(false);
        // re-run current step
        setStep(step);
    };

    // Stepper UI
    const renderStepIcon = (status: StepStatus) => {
        if (status === 'loading') return <LoadingSpinner size="sm" />;
        if (status === 'done') return <span className="text-green-500">✔</span>;
        if (status === 'error') return <span className="text-red-500">✖</span>;
        return <span className="text-gray-400">●</span>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Checkout Progress</DialogTitle>
                    <DialogDescription>
                        Please follow the steps to complete your purchase. Do not close this window.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                    {steps.map((s, i) => (
                        <div key={s.label} className="flex items-center gap-3">
                            {renderStepIcon(s.status)}
                            <span className={
                                `text-base ${s.status === 'done' ? 'text-green-600' : s.status === 'error' ? 'text-red-600' : ''}`
                            }>{s.label}</span>
                            {i === step && s.status === 'loading' && <span className="ml-2 text-xs text-gray-400">In progress...</span>}
                        </div>
                    ))}
                </div>
                {error && (
                    <ErrorDisplay error={error} onRetry={handleRetry} onDismiss={() => onOpenChange(false)} />
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={loading}>
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 