import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let socketInstance;

    if (user) {
      // Establish Socket connection to Node server
      socketInstance = io('http://localhost:5000');
      setSocket(socketInstance);

      // Join room based on user role
      socketInstance.emit('join-room', user.role);

      console.log('Socket connection established.');
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        console.log('Socket disconnected.');
        setSocket(null);
      }
    };
  }, [user]);

  // Helper to send volunteer coordinates
  const emitLocation = (longitude, latitude, status) => {
    if (socket && user) {
      socket.emit('update-location', {
        userId: user._id || user.user?._id,
        longitude,
        latitude,
        status,
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, emitLocation }}>
      {children}
    </SocketContext.Provider>
  );
};
