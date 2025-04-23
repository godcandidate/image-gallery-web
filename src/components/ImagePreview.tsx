import React from 'react';
import { X } from 'lucide-react';
import { Image } from '../types/image';
import ReactDOM from 'react-dom';

interface ImagePreviewProps {
  image: Image;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onClose }) => {
  // Create portal to render at the document body level
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl w-full flex flex-col items-center bg-white/5 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/70 text-white hover:bg-gray-800/90 transition-all duration-200 z-10"
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
        
        {/* Image */}
        <div className="w-full flex justify-center p-6 pt-8">
          <img
            src={image.image_url}
            alt={image.name}
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Metadata */}
        <div className="w-full bg-gradient-to-r from-blue-600/80 to-indigo-600/80 p-5 text-white">
          <h3 className="text-xl font-medium mb-3">{image.name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {image.type && (
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-blue-100">Type</span>
                <span className="text-sm font-medium">{image.type}</span>
              </div>
            )}
            
            {image.model && (
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-blue-100">Model</span>
                <span className="text-sm font-medium">{image.model}</span>
              </div>
            )}
            
            {image.color && (
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-blue-100">Color</span>
                <span className="text-sm font-medium">{image.color}</span>
              </div>
            )}
            
            {!image.type && !image.model && !image.color && (
              <div className="col-span-3 text-center text-sm text-blue-100">
                No additional metadata available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
