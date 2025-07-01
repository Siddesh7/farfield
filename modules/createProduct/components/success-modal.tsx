import React from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui';
import { SuccessIcon } from '@/components/icons';

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shareLink?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ open, onOpenChange, shareLink }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md gap-6">
                <div className='flex flex-col items-center justify-center px-3 py-4 gap-2' >
                    <SuccessIcon width={34} />
                    <div className='flex flex-col items-center justify-center gap-1'>
                        <p className='text-[#000000E0]'>Product Created</p>
                        <p className='text-fade'>Your Product has been Listed</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <div className='flex gap-2 flex-1'>
                            <Button size='lg' type="button" variant="secondary" className='flex-1'>
                                Close
                            </Button>
                            <Button size='lg' type="button" className='flex-2'>
                                Share on Farcaster
                            </Button>
                        </div>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SuccessModal;