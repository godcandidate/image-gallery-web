import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (files: File[], customName?: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const [customFileName, setCustomFileName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFiles(acceptedFiles);
      // If there's only one file, use its name as the default custom name
      if (acceptedFiles.length === 1) {
        setCustomFileName(acceptedFiles[0].name.split('.')[0]);
      }
      setShowModal(true);
    }
  }, []);

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles, customFileName);
      setSelectedFiles([]);
      setCustomFileName('');
      setShowModal(false);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the input when modal opens
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5242880, // 5MB
  });

  return (
    <>
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

      {/* Custom Name Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4 transform transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Customize File Name
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 mb-3 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="mb-1">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <label htmlFor="customFileName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom File Name
              </label>
              <input
                ref={inputRef}
                type="text"
                id="customFileName"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Enter a custom file name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpload();
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};