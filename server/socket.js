import User from './models/User.js';
import Message from './models/Message.js';
import jwt from 'jsonwebtoken';

/**
 * Socket.io event handler module
 * Manages rooms, users, messages, and typing indicators
 */

// In-memory store for room users
const rooms = new Map(); // roomName -> Map<socketId, { username, id, joinedAt }>
const userSocketMap = new Map(); // socketId -> { username, userId, room }
const connectedUsers = new Map(); // userId -> socketId

/**
 * Get list of users in a room
 */
function getRoomUsers(roomName) {
    const roomUsers = rooms.get(roomName);
    if (!roomUsers) return [];
    return Array.from(roomUsers.values());
}

/**
 * Add user to a room
 */
function addUserToRoom(roomName, socketId, username, userId) {
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Map());
    }
    const roomUsers = rooms.get(roomName);
    roomUsers.set(socketId, {
        username,
        id: socketId,
        userId: userId,
        joinedAt: new Date().toISOString(),
    });
    userSocketMap.set(socketId, { username, userId, room: roomName });
}

/**
 * Remove user from their current room
 */
function removeUserFromRoom(socketId) {
    const userData = userSocketMap.get(socketId);
    if (!userData) return null;

    const { room, username } = userData;
    const roomUsers = rooms.get(room);
    if (roomUsers) {
        roomUsers.delete(socketId);
        if (roomUsers.size === 0) {
            rooms.delete(room);
        }
    }
    userSocketMap.delete(socketId);
    return { room, username };
}

/**
 * Check if a username is taken in a specific room
 */
function isUsernameTaken(roomName, username) {
    const roomUsers = rooms.get(roomName);
    if (!roomUsers) return false;
    return Array.from(roomUsers.values()).some(
        (u) => u.username.toLowerCase() === username.toLowerCase()
    );
}

/**
 * Register all socket event handlers
 */
export function registerSocketHandlers(io) {
    // Auth Middleware for Socket.io
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: Token missing'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('Authentication error: User not found'));

            socket.user = user;
            next();
        } catch (err) {
            console.error('Socket Auth Error:', err.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

        const userIdStr = socket.user._id.toString();
        connectedUsers.set(userIdStr, socket.id);
        io.emit('online_users', Array.from(connectedUsers.keys()));

        // --- JOIN ROOM ---
        socket.on('join_room', async ({ room }, callback) => {
            if (!room) {
                return callback?.({ error: 'Room name is required' });
            }

            const trimmedRoom = room.trim();
            if (trimmedRoom.length < 1 || trimmedRoom.length > 100) {
                return callback?.({ error: 'Room name must be 1-100 characters' });
            }

            // Leave previous room if any
            const prev = removeUserFromRoom(socket.id);
            if (prev) {
                socket.leave(prev.room);
                io.to(prev.room).emit('user_left', {
                    username: prev.username,
                    timestamp: new Date().toISOString(),
                });
                io.to(prev.room).emit('room_users', getRoomUsers(prev.room));
            }

            // Join new room
            socket.join(trimmedRoom);
            addUserToRoom(trimmedRoom, socket.id, socket.user.username, socket.user._id);

            // Fetch history from DB
            try {
                const history = await Message.find({ room: trimmedRoom })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate('sender', 'username avatarColor');

                const formattedHistory = history.reverse().map(msg => ({
                    id: msg._id,
                    type: msg.type,
                    username: msg.sender?.username || 'Unknown',
                    content: msg.content,
                    timestamp: msg.createdAt.toISOString(),
                    avatarColor: msg.sender?.avatarColor || '#4ECDC4',
                }));

                // Notify the room
                socket.to(trimmedRoom).emit('user_joined', {
                    username: socket.user.username,
                    timestamp: new Date().toISOString(),
                });

                // Send system message
                io.to(trimmedRoom).emit('message', {
                    id: `sys-${Date.now()}`,
                    type: 'system',
                    content: `${socket.user.username} joined the room`,
                    timestamp: new Date().toISOString(),
                });

                // Broadcast updated user list
                io.to(trimmedRoom).emit('room_users', getRoomUsers(trimmedRoom));

                // Acknowledge success
                callback?.({
                    success: true,
                    room: trimmedRoom,
                    username: socket.user.username,
                    users: getRoomUsers(trimmedRoom),
                    avatarColor: socket.user.avatarColor,
                    history: formattedHistory,
                });

                console.log(`👤 ${socket.user.username} joined room: ${trimmedRoom}`);
            } catch (err) {
                console.error('Error fetching history:', err);
                callback?.({ error: 'Failed to join room' });
            }
        });

        // --- SEND MESSAGE ---
        socket.on('send_message', async ({ content }, callback) => {
            const userData = userSocketMap.get(socket.id);
            if (!userData) {
                return callback?.({ error: 'You must join a room first' });
            }

            if (!content || content.trim().length === 0) {
                return callback?.({ error: 'Message cannot be empty' });
            }

            // Save to MongoDB
            try {
                const newMessage = await Message.create({
                    room: userData.room,
                    sender: userData.userId,
                    content: content.trim(),
                });

                const message = {
                    id: newMessage._id,
                    type: 'user',
                    username: userData.username,
                    content: content.trim(),
                    timestamp: newMessage.createdAt.toISOString(),
                    avatarColor: socket.user.avatarColor,
                };

                io.to(userData.room).emit('message', message);

                if (userData.room.startsWith('dm_')) {
                    const [, id1, id2] = userData.room.split('_');
                    const targetUserId = (id1 === userData.userId.toString()) ? id2 : id1;
                    const targetSocketId = connectedUsers.get(targetUserId);

                    if (targetSocketId) {
                        const roomSet = io.sockets.adapter.rooms.get(userData.room);
                        if (!roomSet || !roomSet.has(targetSocketId)) {
                            io.to(targetSocketId).emit('dm_notification', {
                                room: userData.room,
                                fromUserId: userData.userId,
                                fromUsername: userData.username,
                                message: content.trim()
                            });
                        }
                    }
                }

                callback?.({ success: true, message });
            } catch (err) {
                console.error('Error saving message:', err);
                callback?.({ error: 'Failed to save message' });
            }
        });

        // --- TYPING INDICATOR ---
        socket.on('typing_start', () => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                socket.to(userData.room).emit('user_typing', {
                    username: userData.username,
                    isTyping: true,
                });
            }
        });

        socket.on('typing_stop', () => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                socket.to(userData.room).emit('user_typing', {
                    username: userData.username,
                    isTyping: false,
                });
            }
        });

        // --- VIDEO CALLING (WebRTC Signaling) ---
        socket.on('call_user', ({ to, offer }) => {
            console.log(`📞 Call from ${socket.id} to ${to}`);
            io.to(to).emit('incoming_call', {
                from: socket.id,
                offer,
                callerName: socket.user.username,
            });
        });

        socket.on('answer_call', ({ to, answer }) => {
            console.log(`✅ Call answered by ${socket.id} for ${to}`);
            io.to(to).emit('call_answered', {
                from: socket.id,
                answer,
            });
        });

        socket.on('ice_candidate', ({ to, candidate }) => {
            io.to(to).emit('ice_candidate', {
                from: socket.id,
                candidate,
            });
        });

        socket.on('end_call', ({ to }) => {
            console.log(`🛑 Call ended by ${socket.id}`);
            io.to(to).emit('call_ended', {
                from: socket.id,
            });
        });

        // --- LEAVE ROOM ---
        socket.on('leave_room', (callback) => {
            const userData = removeUserFromRoom(socket.id);
            if (userData) {
                socket.leave(userData.room);

                io.to(userData.room).emit('message', {
                    id: `sys-${Date.now()}`,
                    type: 'system',
                    content: `${userData.username} left the room`,
                    timestamp: new Date().toISOString(),
                });

                io.to(userData.room).emit('user_left', {
                    username: userData.username,
                    timestamp: new Date().toISOString(),
                });

                io.to(userData.room).emit('room_users', getRoomUsers(userData.room));

                console.log(`👋 ${userData.username} left room: ${userData.room}`);
            }
            callback?.({ success: true });
        });

        // --- DISCONNECT ---
        socket.on('disconnect', (reason) => {
            const userIdStr = socket.user._id.toString();

            // Fix multi-tab mapping issue
            if (connectedUsers.get(userIdStr) === socket.id) {
                connectedUsers.delete(userIdStr);
                io.emit('online_users', Array.from(connectedUsers.keys()));
            }

            const userData = removeUserFromRoom(socket.id);
            if (userData) {
                io.to(userData.room).emit('message', {
                    id: `sys-${Date.now()}`,
                    type: 'system',
                    content: `${userData.username} disconnected`,
                    timestamp: new Date().toISOString(),
                });

                io.to(userData.room).emit('user_left', {
                    username: userData.username,
                    timestamp: new Date().toISOString(),
                });

                io.to(userData.room).emit('room_users', getRoomUsers(userData.room));

                console.log(`❌ ${userData.username} disconnected (${reason})`);
            }
        });
    });
}
