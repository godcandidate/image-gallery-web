import { Request, Response } from "express";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import { pool } from "../config/db.js";

// Upload image with metadata
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract metadata from request body
    const { name, type, model, color } = req.body;

    // Upload to S3
    const s3Image = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Store metadata in database
    const query = `
      INSERT INTO images (name, type, model, color, image_url)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      name || null,
      type || null,
      model || null,
      color || null,
      s3Image.url,
    ]);

    return res.status(201).json({
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({
      message: "Failed to upload image",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get all images with metadata
export const getImages = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT * FROM images
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.execute(query);

    return res.status(200).json({
      images: rows,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({
      message: "Failed to fetch images",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete image by ID
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get the image URL from the database
    const getQuery = `
      SELECT image_url FROM images
      WHERE id = ?
    `;

    const [rows] = await pool.execute(getQuery, [id]);

    if (!rows || (rows as any[]).length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imageUrl = (rows as any[])[0].image_url;

    // Extract the key from the URL
    const key = imageUrl.split("/").pop();

    // Delete from S3
    await deleteFromS3(key);

    // Delete from database
    const deleteQuery = `
      DELETE FROM images
      WHERE id = ?
    `;

    await pool.execute(deleteQuery, [id]);

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({
      message: "Failed to delete image",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
