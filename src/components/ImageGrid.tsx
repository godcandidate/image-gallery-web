import React from 'react';
import { ImageCard } from './ImageCard';
import { Loader } from './Loader';
import { Image as ImageType } from '../types/image';

interface ImageGridProps {
  images: ImageType[];
  loading: boolean;
  onDelete: (id: string | number) => void;
  onEdit: (image: ImageType) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, loading, onDelete, onEdit }) => {
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
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};