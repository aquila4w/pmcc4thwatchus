"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  FileImage,
  Video,
  File,
} from "lucide-react";

interface MediaUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  className?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUpload,
  accept = "image/*,video/*,application/pdf",
  maxSize = 10,
  multiple = true,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          errors.push(`${file.name} is too large (max ${maxSize}MB)`);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(", "));
      }

      if (validFiles.length > 0) {
        setIsUploading(true);
        setUploadedCount(0);
        try {
          await onUpload(validFiles);
          setUploadedCount(validFiles.length);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setIsUploading(false);
          setTimeout(() => setUploadedCount(0), 3000);
        }
      }
    },
    [onUpload, maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // Reset input
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="w-6 h-6" />;
    if (file.type.startsWith("video/")) return <Video className="w-6 h-6" />;
    if (file.type === "application/pdf") return <File className="w-6 h-6" />;
    return <FileImage className="w-6 h-6" />;
  };

  return (
    <div className={`media-upload-component ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-slate-300 dark:border-white/20 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5"
          }
          ${isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          type="file"
          id="media-upload-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={isUploading}
        />

        {/* Upload content */}
        <div className="relative z-10 pointer-events-none">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-white">
                Uploading...
              </p>
              <p className="text-sm text-slate-500 dark:text-white/50">
                Please wait while we upload your files
              </p>
            </div>
          ) : uploadedCount > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-white">
                {uploadedCount} file{uploadedCount > 1 ? "s" : ""} uploaded!
              </p>
              <p className="text-sm text-slate-500 dark:text-white/50">
                Your files have been uploaded successfully
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`
                  flex items-center justify-center w-20 h-20 rounded-2xl
                  ${isDragging
                    ? "bg-primary/20 text-primary"
                    : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40"
                  }
                  transition-colors duration-300
                `}>
                  <Upload className="w-10 h-10" />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-700 dark:text-white mb-1">
                  {isDragging ? "Drop files here" : "Upload Media"}
                </p>
                <p className="text-sm text-slate-500 dark:text-white/50">
                  Drag and drop files here, or click to browse
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400 dark:text-white/40">
                <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
                  Images
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
                  Videos
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
                  PDFs
                </span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
                  Max {maxSize}MB
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload tips */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
          Upload Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use high-quality images (minimum 1920x1080px for hero images)</li>
          <li>• JPG format for photos, PNG for graphics with transparency</li>
          <li>• Keep file sizes reasonable for faster loading</li>
        </ul>
      </div>
    </div>
  );
};

// Inline styles for the admin panel
export const MediaUploadStyles = () => (
  <style>{`
    .media-upload-component {
      font-family: system-ui, -apple-system, sans-serif;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `}</style>
);
