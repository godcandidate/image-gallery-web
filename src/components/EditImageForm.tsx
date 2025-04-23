import React, { useState } from 'react';
import { Image } from '../types/image';

interface EditImageFormProps {
  image: Image;
  onSubmit: (imageId: string | number, metadata: { name: string; type?: string; model?: string; color?: string }) => void;
  onCancel: () => void;
}

export const EditImageForm: React.FC<EditImageFormProps> = ({
  image,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState(image.name);
  const [type, setType] = useState(image.type || '');
  const [model, setModel] = useState(image.model || '');
  const [color, setColor] = useState(image.color || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(image.id, {
      name,
      type: type || undefined,
      model: model || undefined,
      color: color || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <img 
          src={image.image_url} 
          alt={image.name} 
          className="w-full max-h-40 object-contain rounded-lg mx-auto"
        />
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type
        </label>
        <input
          type="text"
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="e.g., Portrait, Landscape, Product"
        />
      </div>
      
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Model
        </label>
        <input
          type="text"
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="e.g., Camera model or AI model"
        />
      </div>
      
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Color
        </label>
        <input
          type="text"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="e.g., Red, Blue, Monochrome"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};
