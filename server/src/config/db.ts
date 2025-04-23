import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Database configuration
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database and create tables if they don't exist
export const initializeDatabase = async () => {
  try {
    // Check for required environment variables
    if (missingEnvVars.length > 0) {
      throw new Error(
        `Cannot initialize database. Missing environment variables: ${missingEnvVars.join(
          ", "
        )}`
      );
    }

    // Create the database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );
    await connection.end();

    // Drop the images table if it exists and recreate it with auto-increment ID
    const dropTableQuery = `DROP TABLE IF EXISTS images`;
    await pool.query(dropTableQuery);
    
    // Create the images table with auto-increment ID
    const createTableQuery = `
      CREATE TABLE images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(100),
        model VARCHAR(100),
        color VARCHAR(50),
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createTableQuery);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export default pool;
