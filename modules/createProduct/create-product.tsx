import React, { useEffect, useRef, useState } from 'react';
import { BoxContainer } from '@/components/common';
import { Button, LoadingSpinner } from '@/components/ui';
import AddProductForm from './components/add-product-form';
import { ArrowRight } from 'lucide-react';
import { uploadFile } from '@/lib/utils/file-upload';
import { useAuthenticatedAPI } from '@/lib/hooks';
import { toast } from 'sonner';
import { useGlobalContext } from '@/context/global-context';
import SuccessModal from './components/success-modal';

export type ProductFormVariables = {
    name: string;
    description: string;
    price: number;
    category: string;
    hasExternalLinks: boolean;
    images: string[] | string;
    digitalFiles: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
    }>;
    externalLinks: Array<{
        name: string;
        url: string;
        type: string;
    }>;
    previewFiles: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
    }>;
    tags: string[] | string;
    fileFormat: string[] | string;
    discountPercentage?: number;
    coverImageFile: File | null;  // cover image file
    togglePreviewImage: boolean;
    previewFile: File | null; // preview image file
    productFiles: File[]; // product files
    productLink: string;
};

const defaultFormVariables: ProductFormVariables = {
    name: '',
    description: '',
    price: 0,
    category: '',
    hasExternalLinks: false,
    images: '',
    digitalFiles: [],
    externalLinks: [],
    previewFiles: [],
    tags: '',
    fileFormat: '',
    coverImageFile: null,
    togglePreviewImage: false,
    previewFile: null,
    productFiles: [],
    productLink: '',
};

const CreateProduct = ({ refetchAllProducts }: { refetchAllProducts: () => void }) => {

    const { post } = useAuthenticatedAPI();
    const [open, setOpen] = useState(false);

    const [productId, setProductId] = useState<string | null>(null);
    const [formVariables, setFormVariables] = useState<ProductFormVariables>(defaultFormVariables);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [creatingProduct, setCreatingProduct] = useState(false);
    const [step, setStep] = useState<'idle' | 'creating' | 'publishing'>('idle');

    // Cover Image 
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
    const [coverError, setCoverError] = useState<string | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);

    // Preview Image/pdf
    const previewFileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploadingPreview, setIsUploadingPreview] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // for product file
    const productFilesInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploadingProduct, setIsUploadingProduct] = useState<boolean>(false);
    const [productUploadError, setProductUploadError] = useState<string | null>(null);

    const handleFormVariableChange = (name: keyof ProductFormVariables, value: string | boolean | null) => {
        setFormVariables(prev => ({ ...prev, [name]: value }));
    };

    // Cover image file handler - immediate upload
    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setCoverError("Image must be less than 5MB");
            return;
        }
        const img = new window.Image();
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const target = ev.target as FileReader | null;
            if (target && typeof target.result === 'string') {
                img.src = target.result;
                img.onload = async () => {
                    try {
                        setCoverError(null);
                        setIsUploadingCover(true);
                        setCoverImageURL(target.result as string);
                        const res = await uploadFile(file);
                        if (res && res.fileKey) {
                            setFormVariables(prev => ({
                                ...prev,
                                coverImageFile: file,
                                images: [res.fileKey],
                            } as any));
                        } else {
                            setCoverError('Failed to upload image.');
                            setCoverImageURL(null);
                        }
                    } catch (err: any) {
                        console.error('Cover upload error', err);
                        setCoverError(err?.message || 'Failed to upload image');
                        setCoverImageURL(null);
                    } finally {
                        setIsUploadingCover(false);
                    }
                };
            }
        };
        reader.readAsDataURL(file);
    };

    // Preview file handler - immediate upload
    const handlePreviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPreviewError(null);
        setFormVariables(prev => ({ ...prev, previewFile: file }));
        try {
            setIsUploadingPreview(true);
            const res = await uploadFile(file);
            if (res && res.fileKey && res.size && res.originalName) {
                setFormVariables(prev => ({
                    ...prev,
                    previewFiles: [{
                        fileName: res.originalName,
                        fileUrl: res.fileKey,
                        fileSize: res.size,
                    }],
                } as any));
            } else {
                setPreviewError('Failed to upload preview file.');
            }
        } catch (err: any) {
            console.error('Preview upload error', err);
            setPreviewError(err?.message || 'Failed to upload preview file');
        } finally {
            setIsUploadingPreview(false);
        }
    };

    // Product files handler (multiple) - immediate upload
    const handleProductFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormVariables(prev => ({
                ...prev,
                productFiles: [...(prev.productFiles || []), file],
            }));
            try {
                setProductUploadError(null);
                setIsUploadingProduct(true);
                const res = await uploadFile(file);
                if (res && res.fileKey && res.size && res.originalName) {
                    setFormVariables(prev => ({
                        ...prev,
                        digitalFiles: [
                            ...prev.digitalFiles,
                            {
                                fileName: res.originalName,
                                fileUrl: res.fileKey,
                                fileSize: res.size,
                            },
                        ],
                    } as any));
                } else {
                    setProductUploadError('Failed to upload product file.');
                }
            } catch (err: any) {
                console.error('Product file upload error', err);
                setProductUploadError(err?.message || 'Failed to upload product file');
                setFormVariables(prev => ({
                    ...prev,
                    productFiles: prev.productFiles.filter((f) => f !== file),
                } as any));
            } finally {
                setIsUploadingProduct(false);
            }
        }
        e.target.value = '';
    };

    // Product link handler
    const handleProductLinkChange = (value: string) => {
        let type = 'other';
        const url = value.trim();
        if (url.includes('figma.com')) {
            type = 'figma';
        } else if (url.includes('notion.so')) {
            type = 'notion';
        } else if (url.includes('behance.net')) {
            type = 'behance';
        } else if (url.includes('github.com')) {
            type = 'github';
        }
        setFormVariables(prev => ({
            ...prev,
            productLink: value,
            externalLinks: url ? [{ name: type, url, type }] : [],
        }));
    };

    const handleCreateAndPublishProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreatingProduct(true);
            setStep('creating');
            // Step 1: Create Product
            const basePayload = {
                name: formVariables.name,
                description: formVariables.description,
                price: formVariables.price,
                category: formVariables.category,
                hasExternalLinks: formVariables.hasExternalLinks
            }

            // Use already-uploaded keys from state
            const images: string[] = Array.isArray(formVariables.images)
                ? (formVariables.images as string[])
                : formVariables.images
                    ? [formVariables.images as string]
                    : [];

            const previewFiles = formVariables.togglePreviewImage ? (formVariables.previewFiles || []) : [];

            const digitalFiles = !formVariables.hasExternalLinks ? (formVariables.digitalFiles || []) : [];

            const payload = formVariables.hasExternalLinks
                ? {
                    ...basePayload,
                    images,
                    digitalFiles: undefined,
                    externalLinks: formVariables.externalLinks,
                    previewFiles
                }
                : {
                    ...basePayload,
                    images,
                    externalLinks: undefined,
                    digitalFiles,
                    previewFiles,
                };

            const res = await post("/api/products", payload);
            if (!res.success) {
                toast.error(res.error);
                setStep('idle');
                setCreatingProduct(false);
                return;
            }
            const data = res.data;
            const newProductId = data.id;

            // Step 2: Publish Product
            setStep('publishing');
            const publishRes = await post(`/api/products/${newProductId}/publish`, { published: true });
            if (publishRes.success) {
                toast.success(publishRes.message);
                refetchAllProducts();
                setOpen(true);
                setProductId(null);

                setFormVariables(defaultFormVariables);
                setErrors({});
                setCoverImageURL(null);
                setCoverError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (previewFileInputRef.current) previewFileInputRef.current.value = '';
                if (productFilesInputRef.current) productFilesInputRef.current.value = '';

            } else {
                toast.error(publishRes.error);
            }
        } catch (error: any) {
            console.log("Error in creating and publishing product", error);
            toast.error(error.message);
        } finally {
            setCreatingProduct(false);
            setStep('idle');
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formVariables.category) newErrors.category = "Product type is required";
        if (!formVariables.name) newErrors.name = "Product name is required";
        if (!formVariables.description) newErrors.description = "Description is required";
        if (!formVariables.price || Number(formVariables.price) <= 0) newErrors.price = "Price must be greater than 0";
        return newErrors;
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length === 0) {
            handleCreateAndPublishProduct(e);
        }
    };

    return (
        <BoxContainer className='flex flex-col gap-6 pt-5 px-5.5 flex-1 '>
            <AddProductForm
                formVariables={formVariables}
                setFormVariables={handleFormVariableChange}
                coverError={coverError}
                setCoverError={setCoverError}
                fileInputRef={fileInputRef}
                coverImageURL={coverImageURL}
                setCoverImageURL={setCoverImageURL}
                handleImageChange={handleCoverImageChange}
                isUploadingCover={isUploadingCover}
                previewFileInputRef={previewFileInputRef}
                handlePreviewFileChange={handlePreviewFileChange}
                isUploadingPreview={isUploadingPreview}
                previewError={previewError}
                productFilesInputRef={productFilesInputRef}
                handleProductFilesChange={handleProductFilesChange}
                isUploadingProduct={isUploadingProduct}
                productUploadError={productUploadError}
                handleProductLinkChange={handleProductLinkChange}
                errors={errors}
            />
            <div className="flex gap-3 justify-end pb-9">
                <Button className='flex-1' type="button" variant='outline' size="lg">Draft</Button>
                <Button className='flex-2' type="button" onClick={handleFormSubmit} disabled={creatingProduct || isUploadingCover || isUploadingPreview || isUploadingProduct} size='lg'>
                    {step === 'creating' && (
                        <div className='flex gap-1 items-center'>
                            <LoadingSpinner size='sm' color='secondary' />
                            Creating Product...
                        </div>
                    )}
                    {step === 'publishing' && (
                        <div className='flex gap-1 items-center'>
                            <LoadingSpinner size='sm' color='secondary' />
                            Publishing Product...
                        </div>
                    )}
                    {step === 'idle' && (
                        <div className='flex gap-1 items-center'>
                            Create Product
                            <ArrowRight />
                        </div>
                    )}
                </Button>
            </div>
            <SuccessModal
                open={open}
                onOpenChange={setOpen}
                shareLink="https://your.custom.link/here"
            />
        </BoxContainer>
    );
};

export default CreateProduct;