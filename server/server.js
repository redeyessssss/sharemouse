import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active sessions
const sessions = new Map();

io.on('connection', (socket) => {
  console.log(`[${new Date().toLocaleTimeString()}] Client connected: ${socket.id}`);

  // Host creates a session
  socket.on('create-session', (callback) => {
    const otp = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    sessions.set(otp, {
      hostId: socket.id,
      hostSocket: socket,
      clients: new Map(),
      activeClientId: null
    });
    
    socket.join(`session-${otp}`);
    socket.data.otp = otp;
    socket.data.role = 'host';
    
    console.log(`[${new Date().toLocaleTimeString()}] Session created: ${otp}`);
    callback({ success: true, otp });
  });

  // Client joins a session
  socket.on('join-session', ({ otp }, callback) => {
    const session = sessions.get(otp);
    
    if (!session) {
      callback({ success: false, error: 'Invalid OTP code' });
      return;
    }

    session.clients.set(socket.id, {
      socket: socket,
      position: null,
      active: false
    });
    
    socket.join(`session-${otp}`);
    socket.data.otp = otp;
    socket.data.role = 'client';
    
    console.log(`[${new Date().toLocaleTimeString()}] Client ${socket.id} joined session ${otp}`);
    
    // Notify host
    io.to(session.hostId).emit('client-joined', {
      clientId: socket.id,
      totalClients: session.clients.size
    });
    
    callback({ success: true });
  });

  // Host sets client position
  socket.on('set-client-position', ({ clientId, position }) => {
    const otp = socket.data.otp;
    const session = sessions.get(otp);
    
    if (session && session.hostId === socket.id) {
      const client = session.clients.get(clientId);
      if (client) {
        client.position = position;
        console.log(`[${new Date().toLocaleTimeString()}] Client ${clientId} positioned: ${position}`);
        
        // Notify client of their position
        io.to(clientId).emit('position-assigned', { position });
      }
    }
  });

  // Host switches control to client
  socket.on('switch-to-client', ({ clientId, entryX, entryY }) => {
    const otp = socket.data.otp;
    const session = sessions.get(otp);
    
    if (session && session.hostId === socket.id) {
      const client = session.clients.get(clientId);
      if (client) {
        session.activeClientId = clientId;
        client.active = true;
        
        console.log(`[${new Date().toLocaleTimeString()}] Control switched to client ${clientId}`);
        
        // Tell client to take control
        io.to(clientId).emit('take-control', {
          x: entryX,
          y: entryY
        });
      }
    }
  });

  // Host sends mouse movements to active client
  socket.on('mouse-move', ({ clientId, x, y }) => {
    const otp = socket.data.otp;
    const session = sessions.get(otp);
    
    if (session && session.hostId === socket.id && session.activeClientId === clientId) {
      // Forward mouse movement to client
      io.to(clientId).emit('mouse-move', { x, y });
    }
  });

  // Client returns control to host
  socket.on('return-to-host', ({ exitX, exitY }) => {
    const otp = socket.data.otp;
    const session = sessions.get(otp);
    
    if (session && session.clients.has(socket.id)) {
      const client = session.clients.get(socket.id);
      client.active = false;
      session.activeClientId = null;
      
      console.log(`[${new Date().toLocaleTimeString()}] Control returned to host from ${socket.id}`);
      
      // Tell host to take back control
      io.to(session.hostId).emit('take-back-control', {
        clientId: socket.id,
        x: exitX,
        y: exitY
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Client disconnected: ${socket.id}`);
    
    const otp = socket.data.otp;
    if (!otp) return;
    
    const session = sessions.get(otp);
    if (!session) return;
    
    if (socket.data.role === 'host') {
      // Host disconnected - notify all clients
      session.clients.forEach((client, clientId) => {
        io.to(clientId).emit('host-disconnected');
      });
      sessions.delete(otp);
      console.log(`[${new Date().toLocaleTimeString()}] Session ${otp} deleted`);
    } else {
      // Client disconnected
      session.clients.delete(socket.id);
      io.to(session.hostId).emit('client-disconnected', {
        clientId: socket.id,
        totalClients: session.clients.size
      });
    }
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║   Mouse Share Server Running       ║`);
  console.log(`╚════════════════════════════════════╝`);
  console.log(`\nServer: http://localhost:${PORT}`);
  console.log(`Network: http://0.0.0.0:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
});
