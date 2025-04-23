import pool from '../config/db.js';

export interface Image {
  id: string;
  name: string;
  type?: string;
  model?: string;
  color?: string;
  image_url: string;
  created_at?: string;
}

export class ImageModel {
  // Get all images
  static async getAll(): Promise<Image[]> {
    try {
      const [rows] = await pool.query('SELECT * FROM images ORDER BY created_at DESC');
      return rows as Image[];
    } catch (error) {
      console.error('Error getting images:', error);
      throw error;
    }
  }

  // Get image by id
  static async getById(id: string): Promise<Image | null> {
    try {
      const [rows] = await pool.query('SELECT * FROM images WHERE id = ?', [id]);
      const images = rows as Image[];
      return images.length > 0 ? images[0] : null;
    } catch (error) {
      console.error('Error getting image by id:', error);
      throw error;
    }
  }

  // Create a new image
  static async create(image: Image): Promise<Image> {
    try {
      const { id, name, type, model, color, image_url } = image;
      await pool.query(
        'INSERT INTO images (id, name, type, model, color, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, type, model, color, image_url]
      );
      return image;
    } catch (error) {
      console.error('Error creating image:', error);
      throw error;
    }
  }

  // Update an image
  static async update(id: string, image: Partial<Image>): Promise<Image | null> {
    try {
      const { name, type, model, color, image_url } = image;
      
      // Build the SET clause dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      
      if (type !== undefined) {
        updates.push('type = ?');
        values.push(type);
      }
      
      if (model !== undefined) {
        updates.push('model = ?');
        values.push(model);
      }
      
      if (color !== undefined) {
        updates.push('color = ?');
        values.push(color);
      }
      
      if (image_url !== undefined) {
        updates.push('image_url = ?');
        values.push(image_url);
      }
      
      if (updates.length === 0) {
        return await this.getById(id);
      }
      
      values.push(id);
      
      await pool.query(
        `UPDATE images SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  }

  // Delete an image
  static async delete(id: string): Promise<boolean> {
    try {
      const [result]: any = await pool.query('DELETE FROM images WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}
