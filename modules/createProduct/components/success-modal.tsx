import React from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui';
import { SuccessIcon } from '@/components/icons';
import { sdk } from '@farcaster/frame-sdk';

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shareLink?: string;
    onClose?: () => void;
    productData?: {
        _id: string;
        name: string;
        description: string;
        category: string;
        price: number;
        creator: {
            name: string;
            username: string;
        };
    };
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
    open, 
    onOpenChange, 
    shareLink, 
    onClose,
    productData 
}) => {
    const handleModalClose = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen && onClose) {
            onClose();
        }
    };

    const handleFarcasterShare = async () => {
        if (!productData) return;

        const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
        const productUrl = `${baseUrl}?pId=${productData._id}`;
        
        // Create the simple share text as requested
        const shareText = `I just created my first product on farfield.

Check it out`;

console.log(productUrl)
        try {
            const result = await sdk.actions.composeCast({
                text: shareText,
                embeds: [productUrl]
            });

            // result.cast can be null if user cancels
            if (result?.cast) {
                console.log('Cast posted successfully:', result.cast.hash);
                // Optionally close the modal after successful sharing
                handleModalClose(false);
            }
        } catch (error) {
            console.error('Error composing cast:', error);
            // Could show a toast error here if needed
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleModalClose}>
            <DialogContent className="sm:max-w-md gap-6">
                <DialogTitle className="sr-only">Product Created Successfully</DialogTitle>
                <div className='flex flex-col items-center justify-center px-3 py-4 gap-2' >
                    <SuccessIcon width={34} />
                    <div className='flex flex-col items-center justify-center gap-1'>
                        <p className='text-[#000000E0]'>Product Created</p>
                        <p className='text-fade'>Your Product has been Listed</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-start">
                    <div className='flex gap-2 flex-1'>
                        <DialogClose asChild>
                            <Button size='lg' type="button" variant="secondary" className='flex-1'>
                                Close
                            </Button>
                        </DialogClose>
                        <Button 
                            size='lg' 
                            type="button" 
                            className='flex-2'
                            onClick={handleFarcasterShare}
                        >
                            Share on Farcaster
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SuccessModal;