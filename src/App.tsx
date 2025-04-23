import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageGrid } from './components/ImageGrid';
import { UploadZone } from './components/UploadZone';
import { Pagination } from './components/Pagination';
import { fetchImages, uploadImageWithMetadata, deleteImage, updateImage } from './services/api';
import { Toaster, toast } from 'react-hot-toast';
import type { Image } from './types/image';
import { Modal } from './components/Modal';
import { EditImageForm } from './components/EditImageForm';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const imagesPerPage = 4;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const images = await fetchImages();
      setImages(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[], metadata: { name: string; type: string; model: string; color: string; }[]) => {
    try {
      setLoading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileMetadata = metadata[i];
        const toastId = toast.loading(`Uploading ${file.name}...`);
        
        try {
          // Upload to backend which handles both S3 and database
          const newImage = await uploadImageWithMetadata(file, fileMetadata);
          
          toast.success(`Successfully uploaded ${file.name}!`, { id: toastId });
          
          setImages(prev => [...prev, newImage]);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDelete = async (imageId: string | number) => {
    try {
      setLoading(true);
      const toastId = toast.loading('Deleting image...');
      
      // Delete image from backend (handles both database and S3)
      await deleteImage(String(imageId));
      
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully', { id: toastId });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (image: Image) => {
    setEditingImage(image);
  };

  const handleUpdateImage = async (imageId: string | number, metadata: { name: string; type?: string; model?: string; color?: string }) => {
    try {
      setLoading(true);
      const toastId = toast.loading('Updating image...');
      
      // Update image metadata in the backend
      await updateImage(String(imageId), metadata);
      
      // Update the image in the local state
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, ...metadata } : img
        )
      );
      
      toast.success('Image updated successfully', { id: toastId });
      setEditingImage(null); // Close the edit modal
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image =>
    (image.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: darkMode ? '#374151' : '#fff',
          color: darkMode ? '#fff' : '#000',
        },
      }} />
      
      {/* Edit Image Modal */}
      {editingImage && (
        <Modal
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          title="Edit Image Metadata"
        >
          <EditImageForm
            image={editingImage}
            onSubmit={handleUpdateImage}
            onCancel={() => setEditingImage(null)}
          />
        </Modal>
      )}

      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSearch={handleSearch}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <UploadZone onUpload={handleUpload} />
        </div>
        
        <ImageGrid 
          images={currentImages} 
          loading={loading} 
          onDelete={handleDelete}
          onEdit={handleEdit} 
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </main>
    </div>
  );
}

export default App;