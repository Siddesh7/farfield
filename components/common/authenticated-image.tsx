import { useAuthenticatedFetch } from '@/lib/hooks';
import React, { useEffect, useState } from 'react';

const AuthenticatedImage = ({ fileKey, alt }: { fileKey: string; alt?: string }) => {
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fileKey) return;
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
    }, [authenticatedFetch, fileKey]);

    if (loading) return <div>Loading file...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!imgUrl) return null;

    return (
        <div>
            <img src={imgUrl} alt={alt || "File"} style={{ maxWidth: 300, maxHeight: 300 }} />
            <br />
            <a href={imgUrl} download={fileKey.split("_").pop()}>Download</a>
        </div>
    );
};

export default AuthenticatedImage;