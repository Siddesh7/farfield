import { useAuthenticatedFetch } from '@/lib/hooks';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../ui';

const AuthenticatedImage = ({ fileKey, alt }: { fileKey: string; alt?: string }) => {
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Mark as client-side after mount to avoid hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!fileKey || !isClient) return;
        let url: string | undefined;
        setLoading(true);
        setError(null);

        const fetchImage = async () => {
            try {
                const response = await authenticatedFetch(`/api/files/${fileKey}`, {
                    method: "GET",
                });
                if (!response.ok) throw new Error("Could not fetch file");
                const blob = await response.blob();
                url = window.URL.createObjectURL(blob);
                setImgUrl(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };
        fetchImage();
        return () => {
            if (url) window.URL.revokeObjectURL(url);
        };
    }, [authenticatedFetch, fileKey, isClient]);

    // Always render the fallback image on server and during initial client render
    if (!isClient || loading || error || !imgUrl) {
        return (
            <div className='relative w-[-webkit-fill-available] h-[250px]'>
                <Image src='/Product_Image.png'
                    alt='Product Image'
                    fill style={{ objectFit: 'cover' }} />
            </div>
        );
    }

    return (
        <div className='relative w-[-webkit-fill-available] h-[275px]'>
            <Image src={imgUrl} alt={alt || "File"} fill style={{ objectFit: 'cover' }} />
        </div>
    );
};

export default AuthenticatedImage;