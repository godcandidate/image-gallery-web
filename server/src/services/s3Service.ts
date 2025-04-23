import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log(`Missing required S3 environment variables: ${missingEnvVars.join(', ')}`);
  console.log('Please check your .env file and ensure all required S3 variables are set.');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

export interface S3Image {
  id: string;
  url: string;
  key: string;
  lastModified?: Date;
}

export const listS3Images = async (): Promise<S3Image[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    const imagesPromises = response.Contents
      .filter(object => object.Key !== undefined)
      .map(async (object) => {
        const key = object.Key as string;
        const getObjectCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        
        return {
          id: key,
          key: key,
          url,
          lastModified: object.LastModified
        } as S3Image;
      });

    const images = await Promise.all(imagesPromises);
    return images;
  } catch (error) {
    console.error('Error listing S3 images:', error);
    throw error;
  }
};

export const getS3Image = async (key: string): Promise<S3Image | null> => {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
    
    return {
      id: key,
      key,
      url,
    };
  } catch (error) {
    console.error(`Error getting S3 image with key ${key}:`, error);
    return null;
  }
};

export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<S3Image> => {
  try {
    const timestamp = new Date().toISOString();
    const sanitizedFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileExtension = fileName.split('.').pop() || '';
    const key = `${sanitizedFileName}-${timestamp}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    return {
      id: key,
      key,
      url,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

export const deleteFromS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error deleting S3 object with key ${key}:`, error);
    throw error;
  }
};
