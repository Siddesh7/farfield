export const uploadFile = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        
        // Check if the API response indicates an error
        if (!res.ok || !data.success) {
            const errorMessage = data.error || data.message || `Upload failed with status ${res.status}`;
            throw new Error(errorMessage);
        }
        
        return data.data;
    } catch (error) {
        console.log("Error in uploading file", error);
        // Re-throw the error with the original message if it's already a proper error
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Error in uploading file: ${error}`);
    }
}
