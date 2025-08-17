import React, { useEffect, useRef, useState } from 'react';
import { BoxContainer } from '@/components/common';
import { Button, LoadingSpinner } from '@/components/ui';
import AddProductForm from './components/add-product-form';
import { ArrowRight } from 'lucide-react';
import { useAuthenticatedAPI } from '@/lib/hooks';
import { toast } from 'sonner';
import { useGlobalContext } from '@/context/global-context';
import SuccessModal from './components/success-modal';
import { CreateProductFormVariables } from '@/lib/types/product';
import { uploadFile } from '@/lib/utils/upload-file';

const defaultFormVariables: CreateProductFormVariables = {
    name: '',
    description: '',
    price: 0,
    category: '',
    hasExternalLinks: false,
    images: [],
    digitalFiles: [],
    externalLinks: [],
    tags: '',
    fileFormat: '',
    coverImageFile: null,
    productFiles: [],
    productLink: '',
};

const CreateProduct = ({ refetchAllProducts }: { refetchAllProducts: () => void }) => {

    const { post } = useAuthenticatedAPI();
    const { setActiveModule, setSelectedProduct } = useGlobalContext();
    const [open, setOpen] = useState(false);

    const [productId, setProductId] = useState<string | null>(null);
    const [createdProduct, setCreatedProduct] = useState<any | null>(null);
    const [formVariables, setFormVariables] = useState<CreateProductFormVariables>(defaultFormVariables);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [creatingProduct, setCreatingProduct] = useState(false);
    const [step, setStep] = useState<'idle' | 'publishing'>('idle');

    // Cover Image 
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
    const [coverError, setCoverError] = useState<string | null>(null);
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

    // for product file
    const productFilesInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingProductFile, setUploadingProductFile] = useState(false);


    const handleFormVariableChange = (name: keyof CreateProductFormVariables, value: string | boolean | null) => {
        setFormVariables(prev => ({ 
            ...prev, 
            [name]: name === 'price' ? (value === '' ? 0 : Number(value)) : value 
        }));
    };

    // Cover image file handler
    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }
        
        setUploadingCoverImage(true);
        setCoverError(null);
        
        const img = new window.Image();
        const reader = new FileReader();
        
        reader.onload = async (ev) => {
            const target = ev.target as FileReader | null;
            if (target && typeof target.result === 'string') {
                img.src = target.result;
                img.onload = async () => {
                    setCoverImageURL(target.result as string);
                    
                    try {
                        const res = await uploadFile(file);
                        if (res && res.fileKey) {
                            setFormVariables(prev => ({ ...prev, images: [res.fileKey], coverImageFile: file }));
                            toast.success("Cover image uploaded successfully");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Failed to upload cover image");
                        setCoverImageURL(null);
                    } finally {
                        setUploadingCoverImage(false);
                    }
                };
            }
        };
        reader.readAsDataURL(file);
    };



    // Product files handler (multiple)
    const handleProductFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadingProductFile(true);
        
        try {
            const res = await uploadFile(file);
            if (res && res.fileKey && res.size && res.originalName) {
                setFormVariables(prev => ({
                    ...prev,
                    digitalFiles: [
                        ...(prev.digitalFiles || []),
                        {
                            fileName: res.originalName,
                            fileUrl: res.fileKey,
                            fileSize: res.size,
                        },
                    ],
                    productFiles: [...(prev.productFiles || []), file],
                }));
                toast.success(`${res.originalName} uploaded successfully`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload product file");
        } finally {
            setUploadingProductFile(false);
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
            const basePayload = {
                name: formVariables.name,
                description: formVariables.description,
                price: formVariables.price,
                category: formVariables.category,
                hasExternalLinks: formVariables.hasExternalLinks
            }

            const images: string[] = Array.isArray(formVariables.images) ? formVariables.images : [];

            const digitalFiles: { fileName: string; fileUrl: string; fileSize: number; }[] =
                !formVariables.hasExternalLinks ? (formVariables.digitalFiles || []) : [];

            const payload = formVariables.hasExternalLinks
                ? {
                    ...basePayload,
                    images,
                    digitalFiles: undefined,
                    externalLinks: formVariables.externalLinks
                }
                : {
                    ...basePayload,
                    images,
                    externalLinks: undefined,
                    digitalFiles,
                };

            const res = await post("/api/products?publish=true", payload);
            if (!res.success) {
                toast.error(res.error);
                setStep('idle');
                setCreatingProduct(false);
                return;
            }
            const data = res.data;

            setCreatedProduct(data);
            if(data){
                toast.success(res.message);
                refetchAllProducts();
                setOpen(true);
                setProductId(null);

                setFormVariables(defaultFormVariables);
                setErrors({});
                setCoverImageURL(null);
                setCoverError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (productFilesInputRef.current) productFilesInputRef.current.value = '';

            } else {
                toast.error(res.error);
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

    const handleModalClose = () => {
        if (createdProduct) {
            setSelectedProduct(createdProduct);
            setActiveModule('home');
            setCreatedProduct(null);
        } else {
            setActiveModule('home');
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
                productFilesInputRef={productFilesInputRef}
                handleProductFilesChange={handleProductFilesChange}
                handleProductLinkChange={handleProductLinkChange}
                uploadingCoverImage={uploadingCoverImage}
                uploadingProductFile={uploadingProductFile}
                onRemoveCoverImage={() => {
                    setCoverImageURL(null);
                    setFormVariables(prev => ({ ...prev, images: [], coverImageFile: null }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onRemoveProductFile={(idx: number) => {
                    setFormVariables(prev => ({
                        ...prev,
                        productFiles: prev.productFiles.filter((_, i) => i !== idx),
                        digitalFiles: prev.digitalFiles.filter((_, i) => i !== idx),
                    }));
                }}
                errors={errors}
            />
            <div className="flex gap-3 justify-end pb-9">
                <Button className='flex-2' type="button" onClick={handleFormSubmit} disabled={creatingProduct} size='lg'>
                    {step === 'publishing' && (
                        <div className='flex gap-1 items-center'>
                            <LoadingSpinner size='sm' color='secondary' />
                            Publishing Product...
                        </div>
                    )}
                    {step === 'idle' && (
                        <div className='flex gap-1 items-center'>
                            Publish Product
                            <ArrowRight />
                        </div>
                    )}
                </Button>
            </div>
            <SuccessModal
                open={open}
                onOpenChange={setOpen}
                shareLink="https://your.custom.link/here"
                onClose={handleModalClose}
            />
        </BoxContainer>
    );
};

export default CreateProduct;