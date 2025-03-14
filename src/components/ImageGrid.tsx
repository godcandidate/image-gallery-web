import React from 'react';
import { ImageCard } from './ImageCard';
import { Loader } from './Loader';

interface Image {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

interface ImageGridProps {
  images: Image[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, loading, onDelete }) => {
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 p-4">
      {images.map((image) => (
        <ImageCard 
          key={image.id} 
          image={image} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};