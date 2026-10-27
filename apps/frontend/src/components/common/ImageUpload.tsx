import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (url: string, publicId: string, metadata?: any) => void;
  onRemove: () => void;
  folder?: string;
  placeholderText?: string;
  aspectRatio?: 'square' | 'video' | 'any';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  publicId,
  onChange,
  onRemove,
  folder = 'timetomeal',
  placeholderText = 'Click to upload or drag & drop',
  aspectRatio = 'video'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  const validateFile = (file: File): boolean => {
    setError(null);
    if (!allowedFormats.includes(file.type)) {
      setError('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return false;
    }
    if (file.size > maxSizeBytes) {
      setError('File is too large. Maximum size allowed is 5 MB.');
      return false;
    }
    return true;
  };

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Read file as base64 string
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image: base64Data,
              folder: folder
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to upload image to server');
          }

          const data = await response.json();
          onChange(data.secure_url, data.public_id, {
            image_width: data.width,
            image_height: data.height,
            image_format: data.format,
            image_bytes: data.bytes
          });
        } catch (uploadErr: any) {
          console.error('Upload request failed:', uploadErr);
          setError(uploadErr.message || 'Server upload failed. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read selected file.');
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error('FileReader error:', err);
      setError('An unexpected error occurred during upload.');
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      uploadToCloudinary(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      uploadToCloudinary(file);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!publicId) {
      onRemove();
      return;
    }

    try {
      // Opt-in deletion call to the backend to keep Cloudinary clean
      fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ public_id: publicId })
      }).catch(err => console.error('Silent background deletion failed:', err));
      
      onRemove();
    } catch (err) {
      console.error('Delete error:', err);
      onRemove();
    }
  };

  const isSquare = aspectRatio === 'square';

  return (
    <div id="image-upload-container" className="space-y-2">
      {value ? (
        <div 
          className={`relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 group shadow-sm ${
            isSquare ? 'aspect-square w-32 h-32 mx-auto rounded-full' : 'aspect-video w-full'
          }`}
        >
          <img 
            src={value} 
            alt="Upload preview" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={triggerSelect}
              disabled={isUploading}
              className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-md transition-transform hover:scale-105"
              title="Replace Image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-md transition-transform hover:scale-105"
              title="Remove Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={triggerSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' 
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
          } ${
            isSquare ? 'aspect-square w-32 h-32 mx-auto rounded-full p-2' : 'aspect-video w-full'
          }`}
        >
          {isUploading ? (
            <div className="space-y-2 text-center flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Uploading to Cloudinary...</p>
            </div>
          ) : (
            <div className="space-y-2 text-center flex flex-col items-center">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                <Upload className="w-5 h-5" />
              </div>
              {!isSquare && (
                <>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{placeholderText}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG, WEBP up to 5 MB</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1.5 p-2 px-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-bold border border-red-100 dark:border-red-950/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
