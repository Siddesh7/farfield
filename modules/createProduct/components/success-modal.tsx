import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { SuccessIcon } from "@/components/icons";
import sdk from "@farcaster/frame-sdk";

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  onClose?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  onOpenChange,
  productId,
  onClose,
}) => {
  const handleModalClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  const castHandler = async () => {
    await sdk.actions.composeCast({
      text: "i just listed my very first product in farfield, check it out",
      embeds: [`https://farfield.shop/?pid=${productId}`],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogTitle className="sr-only">
          Product Created Successfully
        </DialogTitle>
        <div className="flex flex-col items-center justify-center px-3 py-4 gap-2">
          <SuccessIcon width={34} />
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[#000000E0]">Product Created</p>
            <p className="text-fade">Your Product has been Listed</p>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <div className="flex gap-2 flex-1">
              <Button
                size="lg"
                type="button"
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                size="lg"
                type="button"
                className="flex-2"
                onClick={castHandler}
              >
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
