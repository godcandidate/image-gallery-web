import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_AWS_BUCKET_NAME;

export interface S3Image {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

export const listImages = async (): Promise<S3Image[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    const images = await Promise.all(
      response.Contents.map(async (object) => {
        if (!object.Key) return null;

        const getObjectCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        
        return {
          id: object.Key,
          url,
          title: object.Key.split('/').pop()?.split('.').shift() || 'Untitled',
          timestamp: object.LastModified?.toISOString() || new Date().toISOString(),
        };
      })
    );

    return images.filter((image): image is S3Image => image !== null);
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
};

export interface UploadProgress {
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  filename: string;
}

export const uploadImage = async (
  file: File,
  title: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<S3Image> => {
  try {
    const timestamp = new Date().toISOString();
    const fileExtension = file.name.split('.').pop();
    const key = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.${fileExtension}`;

    // Convert File to ArrayBuffer and then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    if (onProgress) {
      onProgress({
        status: 'uploading',
        progress: 0,
        filename: file.name
      });
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: uint8Array,
      ContentType: file.type,
    });

    await s3Client.send(command);
    
    if (onProgress) {
      onProgress({
        status: 'completed',
        progress: 100,
        filename: file.name
      });
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    return {
      id: key,
      url,
      title,
      timestamp,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imageId,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};