import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import imageRoutes from './routes/imageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initializeDatabase } from './config/db.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes - prefix with /api
app.use('/api/images', imageRoutes);
app.use('/api/upload', uploadRoutes);

// API Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// For API documentation
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: 'Image Gallery API Server', 
    endpoints: {
      images: '/api/images',
      health: '/api/health'
    }
  });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle client-side routing - serve index.html for specific frontend routes
const frontendRoutes = ['/', '/upload', '/gallery', '/settings'];
frontendRoutes.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
});

// Fallback route for any other routes not matched above
app.use((req, res) => {
  // Check if the request is for a file that might exist in the public directory
  const requestPath = req.path;
  if (requestPath.includes('.')) {
    // This is likely a file request, let the static middleware handle it
    res.status(404).send('File not found');
  } else {
    // This is likely a frontend route, serve the index.html
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database and create tables if they don't exist
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend and API available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
