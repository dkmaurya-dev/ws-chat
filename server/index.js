import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './socket.js';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Redis Adapter Setup
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('🚀 Redis Adapter connected');
}).catch(err => console.error('❌ Redis Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Rooms info endpoint
app.get('/api/rooms', (req, res) => {
    const rooms = io.sockets.adapter.rooms;
    const roomList = [];
    rooms.forEach((sockets, roomName) => {
        // Filter out personal socket rooms
        if (!sockets.has(roomName)) {
            roomList.push({ name: roomName, users: sockets.size });
        }
    });
    res.json(roomList);
});

// Register Socket Handlers
registerSocketHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`🚀 Chat server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io accepting connections from ${CLIENT_URL}`);
});
