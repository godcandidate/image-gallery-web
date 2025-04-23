import { Image } from '../types/image';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchImages = async (): Promise<Image[]> => {
  try {
    const response = await fetch(`${API_URL}/images`);
    if (!response.ok) {
      throw new Error(`Error fetching images: ${response.statusText}`);
    }
    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error('Error in fetchImages:', error);
    throw error;
  }
};

export const fetchImageById = async (id: string): Promise<Image> => {
  try {
    const response = await fetch(`${API_URL}/images/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching image: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchImageById:', error);
    throw error;
  }
};

export const uploadImageWithMetadata = async (
  file: File,
  metadata: {
    name: string;
    type?: string;
    model?: string;
    color?: string;
  }
): Promise<Image> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', metadata.name);
    
    if (metadata.type) formData.append('type', metadata.type);
    if (metadata.model) formData.append('model', metadata.model);
    if (metadata.color) formData.append('color', metadata.color);
    
    const response = await fetch(`${API_URL}/images`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error uploading image: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Error in uploadImageWithMetadata:', error);
    throw error;
  }
};

export const updateImage = async (id: string, imageData: Partial<Image>): Promise<Image> => {
  try {
    const response = await fetch(`${API_URL}/images/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating image: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in updateImage:', error);
    throw error;
  }
};

export const deleteImage = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/images/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting image: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
};
