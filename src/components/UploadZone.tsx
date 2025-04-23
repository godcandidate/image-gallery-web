import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Modal } from './Modal';
import { ImageMetadataForm } from './ImageMetadataForm';

interface UploadZoneProps {
  onUpload: (files: File[], metadata: { name: string; type: string; model: string; color: string; }[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<{ name: string; type: string; model: string; color: string; }[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
    setCurrentFileIndex(0);
    setMetadata([]);
    setIsModalOpen(true);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5242880, // 5MB
  });

  const handleMetadataSubmit = (fileMetadata: { name: string; type: string; model: string; color: string; }) => {
    const newMetadata = [...metadata];
    newMetadata[currentFileIndex] = fileMetadata;
    setMetadata(newMetadata);
    
    if (currentFileIndex < selectedFiles.length - 1) {
      // Move to the next file
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      // All files have metadata, proceed with upload
      setIsModalOpen(false);
      onUpload(selectedFiles, newMetadata);
    }
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? "Drop the files here..."
            : "Drag 'n' drop images here, or click to select files"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Supports: JPG, PNG, GIF (up to 5MB)
        </p>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Image Metadata (${currentFileIndex + 1}/${selectedFiles.length})`}
      >
        {selectedFiles.length > 0 && currentFileIndex < selectedFiles.length && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <img
                src={URL.createObjectURL(selectedFiles[currentFileIndex])}
                alt="Preview"
                className="max-h-40 max-w-full rounded"
              />
            </div>
            <ImageMetadataForm
              onSubmit={handleMetadataSubmit}
              initialName={selectedFiles[currentFileIndex].name.split('.')[0]}
            />
          </div>
        )}
      </Modal>
    </>
  );
};