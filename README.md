# Modern Image Gallery

A modern image gallery web application with MySQL database integration for storing image metadata. The application allows users to upload images to S3 and store additional metadata like name, type, model, and color in a MySQL database.

## Features

- Upload images to AWS S3
- Store image metadata in MySQL database
- Modern, responsive UI with dark mode support
- Image search functionality
- Image deletion
- Detailed image metadata display

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Vite as the build tool

### Backend
- Node.js with TypeScript
- Express.js for the API server
- MySQL for database storage

### Storage
- AWS S3 for image storage

## Project Structure

```
├── server/                # Backend server code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   ├── package.json       # Server dependencies
│   └── tsconfig.json      # TypeScript configuration
├── src/                   # Frontend code
│   ├── components/        # React components
│   ├── services/          # API and S3 services
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── .env.example          # Example environment variables
└── package.json          # Frontend dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- MySQL database
- AWS S3 bucket and credentials

### Environment Variables

#### Frontend (.env)

```
# AWS S3 Configuration
VITE_AWS_REGION=your-aws-region
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_AWS_BUCKET_NAME=your-bucket-name

# API Configuration
VITE_API_URL=http://localhost:3001/api
```

#### Backend (.env)

```
# Database Configuration
DB_HOST=endpoint
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Server Configuration
PORT=3001

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Installation

1. Clone the repository

2. Install frontend dependencies
   ```
   npm install
   ```

3. Install backend dependencies
   ```
   cd server
   npm install
   ```

4. Create `.env` files for both frontend and backend using the provided `.env.example` files

### Running the Application

1. Start the backend server
   ```
   cd server
   npm run dev
   ```

2. Start the frontend development server
   ```
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Database Setup

The application will automatically create the necessary database table if it doesn't exist. The table structure is as follows:

```sql
CREATE TABLE IF NOT EXISTS images (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  model VARCHAR(100),
  color VARCHAR(50),
  image_url VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## License

MIT
