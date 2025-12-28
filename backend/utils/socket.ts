import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { validateDeskSession } from '../controllers/desk.controller';

interface DeskRoom {
  deskClient: Socket | null;
  scannerClient: Socket | null;
}

const deskRooms = new Map<string, DeskRoom>();

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost and local network IPs
        const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
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
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join desk session as laptop (helpdesk)
    socket.on('join-desk', ({ deskId, signature }: { deskId: string; signature: string }) => {
      console.log(`Desk joining: ${deskId}`);
      
      // Validate session
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      // Get or create room
      let room = deskRooms.get(deskId);
      if (!room) {
        room = { deskClient: null, scannerClient: null };
        deskRooms.set(deskId, room);
      }

      // Set this socket as desk client
      room.deskClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'desk';

      // Notify desk of successful join
      socket.emit('desk-joined', { deskId });

      // If scanner already connected, notify desk
      if (room.scannerClient) {
        socket.emit('scanner-connected');
      }

      console.log(`Desk ${deskId} joined successfully`);
    });

    // Join desk session as phone (scanner)
    socket.on('join-scanner', ({ deskId, signature }: { deskId: string; signature: string }) => {
      console.log(`Scanner joining: ${deskId}`);
      
      // Validate session
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      // Get room
      const room = deskRooms.get(deskId);
      if (!room) {
        socket.emit('error', { message: 'Desk session not found' });
        return;
      }

      // Set this socket as scanner client
      room.scannerClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'scanner';

      // Notify scanner of successful join
      socket.emit('scanner-joined', { deskId });

      // Notify desk that scanner is connected
      if (room.deskClient) {
        room.deskClient.emit('scanner-connected');
      }

      console.log(`Scanner joined desk ${deskId}`);
    });

    // Handle scanned participant ID from phone
    socket.on('scan-participant', ({ uniqueId }: { uniqueId: string }) => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      console.log(`Scan received from ${role} in desk ${deskId}: ${uniqueId}`);

      if (role !== 'scanner') {
        socket.emit('error', { message: 'Only scanner can send scans' });
        return;
      }

      const room = deskRooms.get(deskId);
      if (!room || !room.deskClient) {
        socket.emit('error', { message: 'Desk not connected' });
        return;
      }

      // Forward to desk client
      room.deskClient.emit('participant-scanned', { uniqueId });
      
      // Acknowledge scanner
      socket.emit('scan-acknowledged', { uniqueId });

      console.log(`Forwarded scan to desk ${deskId}`);
    });

    // Handle resume scanning signal from desk
    socket.on('resume-scanning', () => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      console.log(`Resume scanning request from ${role} in desk ${deskId}`);

      if (role !== 'desk') {
        socket.emit('error', { message: 'Only desk can resume scanning' });
        return;
      }

      const room = deskRooms.get(deskId);
      if (!room || !room.scannerClient) {
        socket.emit('error', { message: 'Scanner not connected' });
        return;
      }

      // Forward to scanner client
      room.scannerClient.emit('resume-scanning');
      
      console.log(`Forwarded resume-scanning signal to scanner in desk ${deskId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      console.log(`Client disconnected: ${socket.id} (${role})`);

      if (deskId) {
        const room = deskRooms.get(deskId);
        if (room) {
          if (role === 'desk') {
            room.deskClient = null;
            // Notify scanner if connected
            if (room.scannerClient) {
              room.scannerClient.emit('desk-disconnected');
            }
            // Clean up if both disconnected
            if (!room.scannerClient) {
              deskRooms.delete(deskId);
            }
          } else if (role === 'scanner') {
            room.scannerClient = null;
            // Notify desk if connected
            if (room.deskClient) {
              room.deskClient.emit('scanner-disconnected');
            }
            // Clean up if both disconnected
            if (!room.deskClient) {
              deskRooms.delete(deskId);
            }
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};
