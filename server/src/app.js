import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.js';
import incidentRoutes, { setIoInstance } from './routes/incidents.js';
import supplyRoutes from './routes/supplies.js';
import donationRoutes, { setDonationIoInstance } from './routes/donations.js';

// Load environmental variables
dotenv.config();

// Connect to MongoDB Atlas (or local fallback)
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allows connections from React Vite (localhost:5173) and n8n
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Pass Socket.IO instance to routes that need to trigger events
setIoInstance(io);
setDonationIoInstance(io);

// Socket.IO Connection Handlers
import socketHandlers from './socket/handlers.js';
socketHandlers(io);

// CORS Config
app.use(cors());

// Note: Stripe webhook signature verification needs a raw request body.
// The route handles raw requests on its own; other routes use JSON parsing.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/donations/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/donations', donationRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from the React client build directory
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback all other frontend routes to index.html (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Express App Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
