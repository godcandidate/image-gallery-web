import axios from "axios";

// Configuration
const LAMBDA_FUNCTION_URL = import.meta.env.VITE_LAMBDA_FUNCTION_URL || "";
const BUCKET_NAME = import.meta.env.VITE_AWS_BUCKET_NAME || "";
const REGION = import.meta.env.VITE_AWS_REGION || "";

// Helper function to generate the public URL for an S3 object (fallback if Lambda doesn't return URLs)
const getPublicUrl = (key: string): string => {
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
    key
  )}`;
};

export interface S3Image {
  id: string;
  url: string;
  lastModified?: Date;
  size?: number;
  title: string; // Changed from optional to required for App.tsx compatibility
  timestamp: string; // For compatibility with existing code
}

export interface UploadProgress {
  progress: number;
  message?: string;
  status: "uploading" | "completed" | "error"; // For compatibility with existing code
  filename: string; // For compatibility with existing code
}

// List all images in the bucket via Lambda
export const listImages = async (): Promise<S3Image[]> => {
  try {
    const response = await axios.get(`${LAMBDA_FUNCTION_URL}/images`);

    // Transform the response data to match our S3Image interface
    return response.data.map(
      (image: {
        id: string;
        url: string;
        lastModified?: string;
        size?: number;
        title?: string;
      }) => ({
        id: image.id || "",
        url: image.url || getPublicUrl(image.id || ""),
        lastModified: image.lastModified
          ? new Date(image.lastModified)
          : undefined,
        size: image.size,
        title: image.title || image.id?.split("/").pop() || "Untitled",
        timestamp: image.lastModified || new Date().toISOString(), // For compatibility
      })
    );
  } catch (error) {
    console.error("Error listing images via Lambda:", error);
    throw error;
  }
};

// Upload an image to the bucket via Lambda
export const uploadImage = async (
  file: File,
  title: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<S3Image> => {
  try {
    // Generate a unique key for the image using the title
    const fileExtension = file.name.split(".").pop() || "";
    const key = `${title.trim().replace(/\s+/g, "-")}.${fileExtension}`;

    // Report progress (start)
    if (onProgress) {
      onProgress({
        progress: 0,
        message: "Starting upload...",
        status: "uploading",
        filename: file.name,
      });
    }

    try {
      // Convert file to base64
      const fileContent = await file.arrayBuffer();
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(fileContent))
      );

      // Report progress (encoding complete)
      if (onProgress) {
        onProgress({
          progress: 50,
          message: "Sending to server...",
          status: "uploading",
          filename: file.name,
        });
      }

      // Send to Lambda
      const response = await axios.post(`${LAMBDA_FUNCTION_URL}/images`, {
        image: base64Data,
        contentType: file.type,
        title: title,
      });

      // Report progress (complete)
      if (onProgress) {
        onProgress({
          progress: 100,
          message: "Upload complete!",
          status: "completed",
          filename: file.name,
        });
      }

      // Return the uploaded image info
      const timestamp = new Date().toISOString();
      return {
        id: response.data.id || key,
        url: response.data.url || getPublicUrl(key),
        title: title,
        size: file.size,
        lastModified: new Date(),
        timestamp: timestamp,
      };
    } catch (error) {
      console.error("Error uploading image via Lambda:", error);

      // Report error
      if (onProgress) {
        onProgress({
          progress: 0,
          message: "Upload failed: " + (error as Error).message,
          status: "error",
          filename: file.name,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete an image from the bucket via Lambda
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    await axios.delete(`${LAMBDA_FUNCTION_URL}/images/${imageId}`);
  } catch (error) {
    console.error("Error deleting image via Lambda:", error);
    throw error;
  }
};
