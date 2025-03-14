import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5242880, // 5MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? "Drop the files here..."
          : "Drag 'n' drop images here, or click to select files"}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Supports: JPG, PNG, GIF (up to 5MB)
      </p>
    </div>
  );
};