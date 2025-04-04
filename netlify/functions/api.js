// Netlify serverless function to handle API requests
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import session from 'express-session';
import { StorageFactory } from '../../server/storage-factory';
import { registerRoutes } from '../../server/routes';

// Initialize the Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize storage
const storageType = process.env.STORAGE_TYPE === 'memory' ? 'memory' : 'sqlite';
StorageFactory.setStorageType(storageType);

// Register API routes
registerRoutes(app);

// Export the serverless function
export const handler = serverless(app);
