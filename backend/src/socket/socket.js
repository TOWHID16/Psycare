// phycare/backend/src/socket/socket.js

import { Server } from "socket.io";

const userToPeerMap = new Map(); // Maps userId -> peerId
const userToSocketMap = new Map(); // Maps userId -> socketId

export const initializeSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            userToSocketMap.set(userId, socket.id);
            console.log(`User ${userId} connected with socket ${socket.id}`);
        }

        socket.on('peer-ready', ({ userId, peerId }) => {
            userToPeerMap.set(userId, peerId);
            console.log(`User ${userId} is ready with Peer ID ${peerId}`);
        });

        // --- ADD THIS NEW EVENT LISTENER ---
        socket.on('end-call', ({ to }) => {
            const recipientSocketId = userToSocketMap.get(to);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call-ended');
            }
        });

        socket.on('get-peer-id', ({ userId }, callback) => {
            const peerId = userToPeerMap.get(userId);
            callback(peerId);
        });

        socket.on("disconnect", () => {
            // Find the userId associated with the disconnected socket
            let disconnectedUserId;
            for (let [key, value] of userToSocketMap.entries()) {
                if (value === socket.id) {
                    disconnectedUserId = key;
                    break;
                }
            }

            if (disconnectedUserId) {
                userToPeerMap.delete(disconnectedUserId);
                userToSocketMap.delete(disconnectedUserId);
                console.log(`User ${disconnectedUserId} disconnected and cleaned up.`);
            }
        });
    });

    return io;
};