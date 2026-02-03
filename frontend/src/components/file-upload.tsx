"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { fetchClient } from "@/lib/api";

export const FileUpload = ({ onUploadSuccess, mode = "replace" }: { onUploadSuccess: (text: string) => void, mode?: "replace" | "append" }) => {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            toast.info(`Uploading (${mode} mode) and analyzing transcript...`);
            // Use fetchClient to handle Auth
            const res = await fetchClient(`/upload-transcript?mode=${mode}`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            toast.success(`Transcript processed! (${data.transcript_length} chars)`);
            onUploadSuccess(data.transcript_length > 0 ? "Transcript available" : "");

        } catch (error) {
            console.error(error);
            toast.error("Failed to upload transcript");
        } finally {
            setUploading(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    return (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-500'}`}>
            <input {...getInputProps()} />
            {uploading ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Analyzing...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-300 font-medium">Click or drag transcript PDF</p>
                    <p className="text-xs text-gray-500">Supported: PDF (Max 10MB)</p>
                </div>
            )}
        </div>
    )
}
