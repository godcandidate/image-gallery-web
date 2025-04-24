import { Request, Response } from "express";
import dotenv from "dotenv";
import { uploadToS3, deleteFromS3 } from "../services/s3Service.js";
import { pool } from "../config/db.js";
import { Image, ImageRow } from "../types/image.js";

dotenv.config();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
const AWS_REGION = process.env.AWS_REGION || "";


/**
 * Transforms an S3 URL to use a different region
 * @param url Original S3 URL
 * @param targetRegion Target AWS region
 * @returns URL with updated region
 */
export const transformUrlRegion = (url: string, targetRegion: string): string => {
  // Match any AWS region pattern (e.g., us-east-1, eu-west-1)
  const regionPattern = /([a-z]{2})-([a-z]+)-(\d+)/;
  
  return url.replace(regionPattern, targetRegion);
};

// Get all images
export const getImages = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT * FROM images
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.execute(query);
    const images = (rows as ImageRow[]).map(image => ({
      ...image,
      image_url: transformUrlRegion(image.image_url, AWS_REGION)
    }));

    return res.status(200).json({
      images
    });

  } catch (error) {
    console.error("Error fetching images:", error);
    return res.status(500).json({
      message: "Failed to fetch images",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get image by ID
export const getImageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT * FROM images
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    const typedRows = rows as ImageRow[];

    if (!typedRows || typedRows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    return res.status(200).json({
      image: typedRows[0],
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({
      message: "Failed to fetch image",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Create a new image with metadata
export const createImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract metadata from request body
    const { name, type, model, color } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Image name is required" });
    }

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

    const [result] = await pool.execute(query, [
      name,
      type || null,
      model || null,
      color || null,
      s3Image.url,
    ]);

    const insertId = (result as { insertId: number }).insertId;

    return res.status(201).json({
      message: "Image created successfully",
      image: {
        id: insertId,
        name,
        type,
        model,
        color,
        image_url: s3Image.url,
        created_at: new Date(),
      } as Image,
    });
  } catch (error) {
    console.error("Error creating image:", error);
    return res.status(500).json({
      message: "Failed to create image",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Update image by ID
export const updateImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, model, color } = req.body;

    // Check if image exists
    const checkQuery = `
      SELECT * FROM images
      WHERE id = ?
    `;

    const [rows] = await pool.execute(checkQuery, [id]);
    const typedRows = rows as ImageRow[];

    if (!typedRows || typedRows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const existingImage = typedRows[0];

    // Update image metadata
    const updateQuery = `
      UPDATE images
      SET name = ?, type = ?, model = ?, color = ?
      WHERE id = ?
    `;

    await pool.execute(updateQuery, [
      name || existingImage.name,
      type || existingImage.type,
      model || existingImage.model,
      color || existingImage.color,
      id,
    ]);

    return res.status(200).json({
      message: "Image updated successfully",
      image: {
        id: Number(id),
        name: name || existingImage.name,
        type: type || existingImage.type,
        model: model || existingImage.model,
        color: color || existingImage.color,
        image_url: existingImage.image_url,
        created_at: existingImage.created_at,
      } as Image,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    return res.status(500).json({
      message: "Failed to update image",
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
    const typedRows = rows as { image_url: string }[];

    if (!typedRows || typedRows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imageUrl = typedRows[0].image_url;

    // Extract the key from the URL
    // The S3 URL format is typically: https://bucket-name.s3.region.amazonaws.com/key
    // or: https://s3.region.amazonaws.com/bucket-name/key
    let key;

    try {
      // Try to parse the URL to extract the key more reliably
      const url = new URL(imageUrl);
      const pathname = url.pathname;

      // Remove leading slash if present
      key = pathname.startsWith("/") ? pathname.substring(1) : pathname;

      // If URL includes bucket name in the path, remove it
      if (key.startsWith(BUCKET_NAME + "/")) {
        key = key.substring(BUCKET_NAME.length + 1);
      }

      // Decode URL-encoded characters (like %3A to :)
      key = decodeURIComponent(key);
    } catch (urlError) {
      console.error("Error parsing URL:", urlError);

      // Fallback to the simple splitting method
      const urlParts = imageUrl.split("/");
      key = urlParts[urlParts.length - 1];

      // Decode URL-encoded characters in the fallback method too
      try {
        key = decodeURIComponent(key);
      } catch (decodeError) {
        console.error("Error decoding URL characters:", decodeError);
      }

      console.log("Fallback key extraction after decoding:", key);
    }

    if (!key) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }

    // Delete from S3
    try {
      await deleteFromS3(key);
      console.log("S3 deletion successful");
    } catch (s3Error) {
      console.error("Error deleting from S3:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

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
