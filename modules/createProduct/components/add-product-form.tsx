import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Files, Plus, Upload, Check, Crop } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { CreateProductFormVariables } from '@/lib/types/product';
import { PRODUCT_CATEGORIES } from '@/constants';
import { LoadingSpinner, ImageCropper } from '@/components/ui';


const USDC_LOGO = "/USDC.jpg";

interface FileUploadState {
    fileName: string;
    isUploading: boolean;
    error: string | null;
    progress?: number;
}

interface AddProductFormProps {
    formVariables: CreateProductFormVariables;
    setFormVariables: (name: keyof CreateProductFormVariables, value: string | number | boolean | null) => void;
    coverError: string | null;
    setCoverError: (err: string | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    coverImageURL: string | null;
    setCoverImageURL: (url: string | null) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCropComplete: (croppedImageBlob: Blob) => void;
    productFilesInputRef: React.RefObject<HTMLInputElement | null>;
    handleProductFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleProductLinkChange: (value: string) => void;
    onRemoveCoverImage: () => void;
    onRemoveProductFile: (idx: number) => void;
    uploadingCoverImage: boolean;
    uploadingProductFile: boolean;
    fileUploadStates: FileUploadState[];
    errors?: { [key: string]: string };
}

const AddProductForm: React.FC<AddProductFormProps> = ({
    formVariables,
    setFormVariables,
    coverError,
    setCoverError,
    fileInputRef,
    coverImageURL,
    setCoverImageURL,
    handleImageChange,
    onCropComplete,
    productFilesInputRef,
    handleProductFilesChange,
    handleProductLinkChange,
    onRemoveCoverImage,
    onRemoveProductFile,
    uploadingCoverImage,
    uploadingProductFile,
    fileUploadStates,
    errors = {},
}) => {
    // Ref and state for dropdown width
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [dropdownWidth, setDropdownWidth] = React.useState<number | undefined>(undefined);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isFreeProduct, setIsFreeProduct] = useState(false); // Independent toggle state
    
    // Image cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

    React.useEffect(() => {
        if (dropdownOpen && triggerRef.current) {
            setDropdownWidth(triggerRef.current.offsetWidth);
        }
    }, [dropdownOpen]);

    const truncateName = (name: string, max: number = 15) => {
        if (!name) return '';
        return name.length > max ? name.slice(0, max) + '…' : name;
    };

    // Handle image selection and show cropper
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setCoverError("Image must be less than 5MB");
            return;
        }

        setCoverError(null);
        
        // Create a temporary URL for the cropper
        const reader = new FileReader();
        reader.onload = (ev) => {
            const target = ev.target as FileReader | null;
            if (target && typeof target.result === "string") {
                setTempImageSrc(target.result);
                setShowCropper(true);
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle cropped image completion
    const handleCropComplete = (croppedImageBlob: Blob) => {
        // Create a new file from the cropped blob
        const croppedFile = new File([croppedImageBlob], 'cover-image.jpg', {
            type: 'image/jpeg',
        });

        // Create a preview URL for the cropped image
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setCoverImageURL(previewUrl);
        
        // Clear the file input after successful cropping
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        // Call the parent's onCropComplete handler
        onCropComplete(croppedImageBlob);
    };

    return (
        <form className="flex flex-col gap-6 flex-1 pt-22">
            {/* Cover Image Upload */}
            <div className="flex flex-col gap-2 ">
                {coverImageURL ? (
                    <div className="relative w-full h-[200px] rounded overflow-hidden border">
                        <Image src={coverImageURL} alt="Cover" fill style={{ objectFit: 'cover' }} />
                        
                        {/* Subtle upload indicator */}
                        {uploadingCoverImage && (
                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                                <LoadingSpinner size="sm" />
                                <span className="text-white text-xs">Syncing...</span>
                            </div>
                        )}
                        
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                className="bg-white/90 backdrop-blur-sm"
                                onClick={() => {
                                    setTempImageSrc(coverImageURL);
                                    setShowCropper(true);
                                }}
                            >
                                <Crop className="h-3 w-3" />
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                className="bg-white/90 backdrop-blur-sm"
                                onClick={onRemoveCoverImage}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className='bg-fade-background flex flex-col items-center justify-center py-9 px-20 cursor-pointer' onClick={() => !uploadingCoverImage && fileInputRef?.current?.click()}>
                        <div className='flex flex-col items-center justify-center gap-3'>
                            <div className='bg-fade-background px-2 py-2 w-max'>
                                <Plus />
                            </div>
                            <div className='flex flex-col items-center'>
                                <p>Upload your cover image</p>
                                <p className="text-xs text-gray-500 mt-1">Will be cropped to 16:9 format</p>
                            </div>
                        </div>
                    </div>
                )}
                <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={uploadingCoverImage}
                />
                {coverError && <span className="text-red-500 text-xs">{coverError}</span>}
            </div>

            {/* Product Type Dropdown */}
            <div className='flex flex-col gap-2'>
                <Label className='text-fade text-xs'>
                    Product Type <span className="text-red-500">*</span>
                </Label>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            className="w-full flex justify-between items-center bg-fade-background"
                        >
                            <span>{formVariables.category || 'Select Product Type'}</span>
                            {dropdownOpen ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='p-0'
                        align="start"
                        style={dropdownWidth ? { width: dropdownWidth } : undefined}
                    >
                        <DropdownMenuGroup>
                            {PRODUCT_CATEGORIES.map((type) => (
                                <DropdownMenuItem
                                    key={type}
                                    onClick={() => { setFormVariables('category', type); setDropdownOpen(false); }}
                                    className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    {type}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                {errors.category && <span className="text-red-500 text-xs">{errors.category}</span>}
            </div>

            {/* Product Name */}
            <div className='flex flex-col gap-2'>
                <Label htmlFor="productName" className='text-fade text-xs'>Product Name <span className="text-red-500">*</span></Label>
                <Input
                    id="productName"
                    value={formVariables.name}
                    onChange={e => setFormVariables('name', e.target.value)}
                    placeholder="Enter product name"
                    className='text-sm bg-fade-background'
                />
                {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}

            </div>

            {/* Description */}
            <div className='flex flex-col gap-2'>
                <Label htmlFor="description" className='text-fade text-xs'>Add Description (Max 250 Characters)<span className="text-red-500">*</span> </Label>
                <textarea
                    id="description"
                    className="w-full border rounded px-3 py-2 mt-1 resize-none text-sm bg-fade-background"
                    value={formVariables.description}
                    onChange={e => {
                        if (e.target.value.length <= 250) setFormVariables('description', e.target.value);
                    }}
                    placeholder="Enter product description (max 250 characters)"
                    rows={4}
                />
                <div className="text-xs text-muted-foreground text-right">{formVariables.description.length}/250</div>
                {errors.description && <span className="text-red-500 text-xs">{errors.description}</span>}
            </div>

            {/* Add your product section */}
            <div>
                <div className="flex gap-2 justify-between">
                    <Label className='text-fade text-xs'>Add your Product</Label>
                    <div className="flex items-center bg-fade-background rounded-xl">
                        <Toggle
                            size="sm"
                            pressed={!formVariables.hasExternalLinks}
                            onPressedChange={() => {
                                console.log("Add File toggle clicked, setting hasExternalLinks to false");
                                setFormVariables('hasExternalLinks', false);
                            }}
                            className={`px-4 ${!formVariables.hasExternalLinks ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            Add a File
                        </Toggle>
                        <Toggle
                            size="sm"
                            pressed={formVariables.hasExternalLinks}
                            onPressedChange={() => {
                                console.log("Add Link toggle clicked, setting hasExternalLinks to true");
                                setFormVariables('hasExternalLinks', true);
                            }}
                            className={`px-4 ${formVariables.hasExternalLinks ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            Add a Link
                        </Toggle>
                    </div>
                </div>
                {!formVariables.hasExternalLinks ? (
                    <div className="flex flex-col gap-2 mt-2 ">
                        {uploadingProductFile ? (
                            <div className="flex gap-2 bg-fade-background px-4 py-5.5 justify-center rounded text-center text-sm">
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <p className="text-fade">Uploading file...</p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="flex gap-2 bg-fade-background px-4 py-5.5 justify-center rounded text-center cursor-pointer text-sm text-fade hover:bg-gray-100 transition-colors"
                                onClick={() => !uploadingProductFile && productFilesInputRef.current?.click()}
                            >
                                <Upload />
                                <p>Upload Images, PDFs, Audio, or Video files</p>
                            </div>
                        )}
                        <input
                            ref={productFilesInputRef}
                            id="productFiles"
                            type="file"
                            accept="image/*,application/pdf,audio/*,video/*,application/zip"
                            className="hidden"
                            onChange={handleProductFilesChange}
                            disabled={uploadingProductFile}
                            multiple
                        />
                        {/* Show successfully uploaded files */}
                        {formVariables.productFiles && formVariables.productFiles.length > 0 && (
                            <div className="text-xs mt-2 space-y-2">
                                {formVariables.productFiles.map((file, idx) => (
                                    <div key={`uploaded-${idx}`} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                        <div className='flex gap-2 items-center'>
                                            <Files className="text-green-600" />
                                            <span title={file.name} className="text-green-800">
                                                {truncateName(file.name, 15)} ({(file.size / 1024 < 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(2) + ' MB')})
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 px-2 py-0 h-6"
                                            onClick={() => onRemoveProductFile(idx)}
                                            disabled={uploadingProductFile}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mt-2">
                        <Input
                            type="url"
                            placeholder="Enter product link (e.g. https://...)"
                            value={formVariables.productLink}
                            onChange={e => handleProductLinkChange(e.target.value)}
                            className="text-sm bg-fade-background"
                        />
                    </div>
                )}
            </div>

            {/* Price in USDC */}
            <div className='flex flex-col gap-2'>
                <Label htmlFor="price" className='text-fade text-xs'>Set a Price <span className="text-red-500">*</span></Label>
                <div className={`flex items-center border rounded px-3 py-1 mt-1 bg-fade-background focus-within:border-[#0000001F] focus-within:ring-2 focus-within:ring-primary/20 transition-colors ${isFreeProduct ? 'opacity-50' : ''}`}>
                    <div className='flex border-r-1 gap-1 items-center'>
                        <Image src={USDC_LOGO} alt="USDC" width={24} height={24} />
                        <p className='mr-2'>USDC </p>
                    </div>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="flex-1 bg-transparent outline-none border-none shadow-none text-left focus-visible:ring-0 focus-visible:border-none"
                        value={isFreeProduct ? '' : formVariables.price.toString()}
                        placeholder="0.00"
                        disabled={isFreeProduct}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '.') {
                                setFormVariables('price', 0);
                            } else {
                                const numericValue = parseFloat(value);
                                if (!isNaN(numericValue) && numericValue >= 0) {
                                    setFormVariables('price', numericValue);
                                }
                            }
                        }}
                    />
                </div>
                
                {/* Free Product Toggle */}
                <div className="flex items-center gap-2 mt-1">
                    <Toggle
                        id="freeToggle"
                        size="sm"
                        variant="outline"
                        pressed={isFreeProduct}
                        onPressedChange={(pressed) => {
                            setIsFreeProduct(pressed);
                            if (pressed) {
                                // Toggle ON: Set as free product (price = 0)
                                setFormVariables('price', 0);
                            } else {
                                // Toggle OFF: Set a default price if currently 0
                                if (formVariables.price === 0) {
                                    setFormVariables('price', 1); // Default to 1 USDC when toggling off free
                                }
                            }
                        }}
                        className="h-6 w-6 min-w-6 px-0"
                    >
                        {isFreeProduct && (
                            <Check className="h-3 w-3" />
                        )}
                    </Toggle>
                    <Label htmlFor="freeToggle" className='text-xs text-fade cursor-pointer'>
                        Sell this product for free
                    </Label>
                </div>
                
                {errors.price && <span className="text-red-500 text-xs">{errors.price}</span>}
            </div>

            {/* Image Cropper Modal */}
            {tempImageSrc && (
                <ImageCropper
                    isOpen={showCropper}
                    onClose={() => {
                        setShowCropper(false);
                        setTempImageSrc(null);
                        // Clear the file input so the same file can be selected again
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }}
                    imageSrc={tempImageSrc}
                    onCropComplete={handleCropComplete}
                />
            )}
        </form>
    );
};

export default AddProductForm;