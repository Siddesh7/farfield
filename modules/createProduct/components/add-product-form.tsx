import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Files, FileText, Plus, Upload } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui';
import { ProductFormVariables } from '../create-product';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

const PRODUCT_TYPES = ["Books", "Art", "Entertainment", "Technology"];
const USDC_LOGO = "/USDC.jpg";

interface AddProductFormProps {
    formVariables: ProductFormVariables;
    setFormVariables: (name: keyof ProductFormVariables, value: string | boolean | null) => void;
    coverError: string | null;
    setCoverError: (err: string | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    coverImageURL: string | null;
    setCoverImageURL: (url: string | null) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingCover?: boolean;
    previewFileInputRef: React.RefObject<HTMLInputElement | null>;
    handlePreviewFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingPreview?: boolean;
    previewError?: string | null;
    productFilesInputRef: React.RefObject<HTMLInputElement | null>;
    handleProductFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingProduct?: boolean;
    productUploadError?: string | null;
    handleProductLinkChange: (value: string) => void;
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
    isUploadingCover,
    previewFileInputRef,
    handlePreviewFileChange,
    isUploadingPreview,
    previewError,
    productFilesInputRef,
    handleProductFilesChange,
    isUploadingProduct,
    productUploadError,
    handleProductLinkChange,
    errors = {},
}) => {
    // Ref and state for dropdown width
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [dropdownWidth, setDropdownWidth] = React.useState<number | undefined>(undefined);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    React.useEffect(() => {
        if (dropdownOpen && triggerRef.current) {
            setDropdownWidth(triggerRef.current.offsetWidth);
        }
    }, [dropdownOpen]);

    return (
        <form className="flex flex-col gap-6 flex-1 pt-22">
            {/* Cover Image Upload */}
            <div className="flex flex-col gap-2 ">
                {coverImageURL ? (
                    <div className="relative w-['-webkit-fill-available'] h-[250px] rounded overflow-hidden border">
                        <Image src={coverImageURL} alt="Cover" fill style={{ objectFit: 'cover' }} />
                        <Button type="button" variant="outline" className="absolute top-2 right-2 z-10" onClick={() => { setCoverImageURL(null); setFormVariables('images', '' as any); setFormVariables('coverImageFile', null as any); }}>Remove</Button>
                        {isUploadingCover && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <LoadingSpinner size='sm' /> Uploading cover...
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`bg-fade-background flex flex-col items-center justify-center py-9 px-20 ${isUploadingCover ? 'opacity-70 pointer-events-none' : ''}`} onClick={() => fileInputRef?.current?.click()}>
                        <div className='flex flex-col items-center justify-center gap-3'>
                            <div className='bg-fade-background px-2 py-2 w-max'>
                                <Plus />
                            </div>
                            <div className='flex flex-col items-center'>
                                <p>Upload your cover image</p>
                                <p className='text-sm text-fade'>Max 5mb</p>
                            </div>
                        </div>
                        {isUploadingCover && (
                            <div className="mt-2 text-xs text-fade flex items-center gap-2">
                                <LoadingSpinner size='sm' /> Uploading...
                            </div>
                        )}
                    </div>
                )}
                <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
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
                            {PRODUCT_TYPES.map((type) => (
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

            {/* Upload your image/pdf section */}
            <div>
                <div className="flex gap-2 justify-between">
                    <Label className='text-fade text-xs'>Want to add a preview image/pdf?</Label>
                    <div className="flex items-center bg-fade-background rounded-xl">
                        <Toggle
                            size="sm"
                            pressed={!!formVariables.togglePreviewImage}
                            onPressedChange={() => setFormVariables('togglePreviewImage', true)}
                            className={`px-4 py-0.5  ${formVariables.togglePreviewImage ? 'bg-black text-white' : ''} `}
                        >
                            Yes
                        </Toggle>
                        <Toggle
                            size="sm"
                            pressed={!formVariables.togglePreviewImage}
                            onPressedChange={() => setFormVariables('togglePreviewImage', false)}
                            className={`px-4 py-0.5  ${!formVariables.togglePreviewImage ? 'bg-black text-white' : ''} `}
                        >
                            No
                        </Toggle>
                    </div>
                </div>
                {formVariables.togglePreviewImage && (
                    <div className="flex flex-col gap-2 mt-2 ">
                        <div
                            className={`flex gap-2 bg-fade-background px-4 py-5.5 justify-center rounded text-center cursor-pointer text-sm text-fade ${isUploadingPreview ? 'opacity-70 pointer-events-none' : ''}`}
                            onClick={() => previewFileInputRef.current?.click()}
                        >
                            <Upload />
                            <p>Upload preview image/pdf</p>
                        </div>
                        <input
                            ref={previewFileInputRef}
                            id="previewFile"
                            type="file"
                            accept="image/*,application/pdf,audio/mp3"
                            className="hidden"
                            onChange={handlePreviewFileChange}
                        />
                        {isUploadingPreview && (
                            <div className="text-xs text-fade mt-1 flex items-center gap-2">
                                <LoadingSpinner size='sm' /> Uploading preview...
                            </div>
                        )}
                        {previewError && <div className="text-red-500 text-xs">{previewError}</div>}
                        {formVariables.previewFile && (
                            <div className="text-xs mt-2 flex items-center justify-between">
                                <div className='flex gap-0.5 items-center'>
                                    <FileText />
                                    <span>
                                        {formVariables.previewFile.name} (
                                        {formVariables.previewFile.size / 1024 < 1024
                                            ? (formVariables.previewFile.size / 1024).toFixed(1) + ' KB'
                                            : (formVariables.previewFile.size / (1024 * 1024)).toFixed(2) + ' MB'}
                                        )
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 px-2 py-0 h-6"
                                    onClick={() => { setFormVariables('previewFile', null as any); setFormVariables('previewFiles', [] as any); }}
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add your product section */}
            <div>
                <div className="flex gap-2 justify-between">
                    <Label className='text-fade text-xs'>Add your Product</Label>
                    <div className="flex items-center bg-fade-background rounded-xl">
                        <Toggle
                            size="sm"
                            pressed={!formVariables.hasExternalLinks}
                            onPressedChange={(pressed) => setFormVariables('hasExternalLinks', !pressed)}
                            className={`px-4  ${formVariables.hasExternalLinks ? '' : 'bg-black text-white'} `}
                        >
                            Add a File
                        </Toggle>
                        <Toggle
                            size="sm"
                            pressed={formVariables.hasExternalLinks}
                            onPressedChange={(pressed) => setFormVariables('hasExternalLinks', pressed)}
                            className={`px-4  ${formVariables.hasExternalLinks ? 'bg-black text-white' : ''} `}
                        >
                            Add a Link
                        </Toggle>
                    </div>
                </div>
                {!formVariables.hasExternalLinks ? (
                    <div className="flex flex-col gap-2 mt-2 ">
                        <div
                            className={`flex gap-2 bg-fade-background px-4 py-5.5 justify-center rounded text-center cursor-pointer text-sm text-fade ${isUploadingProduct ? 'opacity-70 pointer-events-none' : ''}`}
                            onClick={() => productFilesInputRef.current?.click()}
                        >
                            <Upload />
                            <p>Upload Pdf/png/mp3 </p>
                        </div>
                        <input
                            ref={productFilesInputRef}
                            id="productFiles"
                            type="file"
                            accept="image/*,application/pdf,audio/mp3"
                            className="hidden"
                            onChange={handleProductFilesChange}
                        />
                        {isUploadingProduct && (
                            <div className="text-xs text-fade mt-1 flex items-center gap-2">
                                <LoadingSpinner size='sm' /> Uploading file...
                            </div>
                        )}
                        {productUploadError && <div className="text-red-500 text-xs">{productUploadError}</div>}
                        {/* Show selected files */}
                        {formVariables.productFiles && formVariables.productFiles.length > 0 && (
                            <div className="text-xs mt-2">
                                {formVariables.productFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <Files />
                                        <span>{file.name} ({(file.size / 1024 < 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(2) + ' MB')})</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 px-2 py-0 h-6"
                                            onClick={() => {
                                                const newFiles = formVariables.productFiles.filter((_, i) => i !== idx);
                                                setFormVariables('productFiles', newFiles as any);
                                                const filteredDigital = (formVariables.digitalFiles || []).filter(df => df.fileName !== file.name);
                                                setFormVariables('digitalFiles', filteredDigital as any);
                                            }}
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
                <div className="flex items-center border rounded px-3 py-1 mt-1 bg-fade-background focus-within:border-[#0000001F] focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                    <div className='flex border-r-1 gap-1'>
                        <p>USDC </p>
                        <Image src={USDC_LOGO} alt="USDC" width={24} height={24} className="mr-2" />
                    </div>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="flex-1 bg-transparent outline-none border-none shadow-none text-left focus-visible:ring-0 focus-visible:border-none"
                        value={formVariables.price}
                        onChange={e => setFormVariables('price', e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                {errors.price && <span className="text-red-500 text-xs">{errors.price}</span>}
            </div>

        </form>
    );
};

export default AddProductForm;