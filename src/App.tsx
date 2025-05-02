import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ImageGrid } from "./components/ImageGrid";
import { UploadZone } from "./components/UploadZone";
import { Pagination } from "./components/Pagination";
import {
  listImages,
  uploadImage,
  deleteImage,
  type S3Image,
  type UploadProgress,
} from "./services/s3";
import { Toaster, toast } from "react-hot-toast";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [images, setImages] = useState<S3Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 4;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const fetchedImages = await listImages();
        setImages(fetchedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleUpload = async (files: File[], customName?: string) => {
    try {
      setLoading(true);
      for (const file of files) {
        const title = customName || file.name.split(".")[0];
        const displayName = customName || file.name;
        const toastId = toast.loading(`Uploading ${displayName}...`);

        const uploadedImage = await uploadImage(
          file,
          title,
          (progress: UploadProgress) => {
            if (progress.status === "uploading") {
              toast.loading(`Uploading ${displayName}: ${progress.progress}%`, {
                id: toastId,
              });
            } else if (progress.status === "completed") {
              toast.success(`Successfully uploaded ${displayName}!`, {
                id: toastId,
              });
            } else if (progress.status === "error") {
              toast.error(`Failed to upload ${displayName}`, { id: toastId });
            }
          }
        );

        setImages((prev) => [...prev, uploadedImage]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleDelete = async (imageId: string) => {
    try {
      setLoading(true);
      await deleteImage(imageId);
      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter((image) =>
    image.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = filteredImages.slice(
    indexOfFirstImage,
    indexOfLastImage
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: darkMode ? "#374151" : "#fff",
            color: darkMode ? "#fff" : "#000",
          },
        }}
      />
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
