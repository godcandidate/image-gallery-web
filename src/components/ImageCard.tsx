import React, { useState } from 'react';
import { Maximize2, Download, Trash2, Edit } from 'lucide-react';
import { Image } from '../types/image';
import { ImagePreview } from './ImagePreview';

interface ImageCardProps {
  image: Image;
  onDelete: (id: string | number) => void;
  onEdit: (image: Image) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formatDate = (timestamp: string | Date | undefined) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          src={image.image_url}
          alt={image.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-4 transition-opacity duration-300">
            <button 
              className="p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              <Maximize2 size={20} />
            </button>
            <button className="p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
              <Download size={20} />
            </button>
            <button 
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {image.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(image.created_at || '')}
            </p>
          </div>
          <div>
            <button 
              onClick={() => onEdit(image)}
              className="p-1 rounded-full bg-blue-100 dark:bg-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Use the ImagePreview component */}
      {showPreview && <ImagePreview image={image} onClose={() => setShowPreview(false)} />}
    </div>
  );
};