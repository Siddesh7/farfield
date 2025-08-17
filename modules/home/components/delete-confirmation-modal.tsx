"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DeleteIcon } from '@/components/icons';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "This action cannot be undone.",
  itemName,
  isLoading = false,
  loadingText = "Deleting...",
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <DeleteIcon width={40} color="#DE2424" />
          </div>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-fade">
            {itemName && (
              <span className="block mb-2">
                Are you sure you want to delete this product?
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
             className='flex-2 bg-red-500'
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {loadingText}
              </>
            ) : (
              <>
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
