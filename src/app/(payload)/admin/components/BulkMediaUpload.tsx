"use client";

import React, { useState, useCallback } from "react";
import { MediaUpload } from "./MediaUpload";
import { MediaUploadStyles } from "./MediaUpload";
import {
  UploadCloud,
  Grid3x3,
  List,
  Check,
  AlertCircle,
} from "lucide-react";

interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  size: number;
}

export const BulkMediaUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const handleUpload = useCallback(async (files: File[]) => {
    const results: UploadedFile[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Upload to Payload CMS media API
        const response = await fetch("/payload-api/media", {
          method: "POST",
          headers: {
            // Note: For CSRF protection, you might need to include the CSRF token
            // Payload CMS handles this automatically when using the admin form
          },
          body: formData,
          // @ts-ignore - Next.js types
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.doc) {
            results.push({
              id: data.doc.id,
              filename: data.doc.filename,
              url: data.doc.url,
              size: file.size,
            });
          }
        }
      } catch (error) {
        console.error("Upload failed for", file.name, error);
      }
    }

    setUploadedFiles(prev => [...prev, ...results]);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bulk-media-upload p-6 max-w-6xl mx-auto">
      <MediaUploadStyles />
      <style>{`
        .bulk-media-upload {
          background: var(--slate-900);
          min-height: 100vh;
          color: white;
        }
        .bulk-media-upload h1,
        .bulk-media-upload h2,
        .bulk-media-upload h3 {
          color: white;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <UploadCloud className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Media Upload</h1>
            <p className="text-slate-400 text-sm">
              Upload multiple images, videos, and documents at once
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <MediaUpload
          onUpload={handleUpload}
          accept="image/*,video/*,application/pdf"
          maxSize={20}
          multiple={true}
        />
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Uploaded Files ({uploadedFiles.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative bg-slate-800 rounded-lg overflow-hidden aspect-square"
                >
                  {file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
                      <span className="text-xs text-slate-400 truncate px-2">
                        {file.filename}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs text-white truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-slate-300">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      File
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {uploadedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={file.url}
                              alt={file.filename}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <span className="text-sm text-white truncate max-w-xs">
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <Check className="w-3 h-3" />
                          Uploaded
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Upload Complete!
              </p>
              <p className="text-xs text-green-400/70">
                {uploadedFiles.length} file(s) are now available in the Media library
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
