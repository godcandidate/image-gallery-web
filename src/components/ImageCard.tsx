import React, { useState } from 'react';
import { Maximize2, Download, Trash2 } from 'lucide-react';

interface Image {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

interface ImageCardProps {
  image: Image;
  onDelete: (id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (timestamp: string) => {
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
          src={image.url}
          alt={image.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-4 transition-opacity duration-300">
            <button className="p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {image.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(image.timestamp)}
        </p>
      </div>
    </div>
  );
};