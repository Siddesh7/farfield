export const uploadFile = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.log("Error in uploading file", error);
        throw new Error(`Error in uploading file: ${error}`);
    }
}
