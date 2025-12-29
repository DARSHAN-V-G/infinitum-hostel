import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { connectDB } from './config/database';
import roomRoutes from './routes/room.routes';
import accommodationRoutes from './routes/accommodation.routes';
import deskRoutes from './routes/desk.routes';
import { initializeSocket } from './utils/socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and local network IPs
    const allowedOrigins = [
      'http://localhost:5173',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
      'https://infinitum-hostel.vercel.app',
      /^http:\/\/192\.168\.\d+\.\d+:5173$/, // 192.168.x.x:5173
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,   // 10.x.x.x:5173
      /^http:\/\/172\.\d+\.\d+\.\d+:5173$/,  // 172.x.x.x:5173
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Hotel server is running');
});
app.get('/api/acc', (req, res) => {
  res.send('Hotel server is running with /api/acc');
});

app.use('/api/acc/rooms', roomRoutes);
app.use('/api/acc/accommodation', accommodationRoutes);
app.use('/api/acc/desk', deskRoutes);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
