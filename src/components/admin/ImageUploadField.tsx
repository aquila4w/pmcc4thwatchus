"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadFieldProps {
  value: string | null;
  onChange: (value: string | null, url?: string | null) => void;
  previewUrl?: string | null;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUploadField({
  value,
  onChange,
  previewUrl,
  label = "Image",
  accept = "image/*",
  maxSizeMB = 10,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large (max ${maxSizeMB}MB)`);
        return;
      }

      setIsUploading(true);
      setError(null);

      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", file.name);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setLocalPreview(null);
        onChange(data.id, data.url || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setLocalPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const handleRemove = () => {
    onChange(null);
    setLocalPreview(null);
    setError(null);
  };

  const displayPreview = localPreview || previewUrl;

  if (displayPreview && !isUploading) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={displayPreview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-800 rounded-md text-sm font-medium hover:bg-slate-100"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
            >
              <X className="w-4 h-4 inline mr-1" />
              Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"}
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-slate-500">
                {accept.replace("/*", "")} up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && <input type="hidden" name="heroImage" value={value} />}
    </div>
  );
}
