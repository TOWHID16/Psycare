// phycare/frontend/src/contexts/SocketContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

export const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const socketRef = useRef(null);
    const { currentUser } = useAuth();
    // We use a state to trigger a re-render when the socket connects
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (currentUser && !socketRef.current) {
            const newSocket = io("http://localhost:8000", { // Using direct URL for reliability
                query: { userId: currentUser._id },
            });

            socketRef.current = newSocket;
            setSocket(newSocket); // Set the socket to state

            newSocket.on('connect', () => {
                console.log('Socket ✅: Connected to server with ID', newSocket.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket ❌: Disconnected from server');
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [currentUser]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {/* We render children immediately to avoid the Vite error */}
            {children}
        </SocketContext.Provider>
    );
};