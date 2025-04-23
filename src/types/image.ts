export interface Image {
  id: string | number;
  name: string;
  type?: string | null;
  model?: string | null;
  color?: string | null;
  image_url: string;
  created_at?: string | Date;
}

export interface UploadProgress {
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  filename: string;
}
