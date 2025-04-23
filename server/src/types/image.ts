export interface Image {
  id?: number;
  name: string;
  type?: string;
  model?: string;
  color?: string;
  image_url: string;
  created_at?: Date;
}

export interface ImageRow {
  id: number;
  name: string;
  type: string | null;
  model: string | null;
  color: string | null;
  image_url: string;
  created_at: Date;
}
