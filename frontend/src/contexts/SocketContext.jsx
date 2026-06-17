import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({ onlineCount: 0 });

export function SocketProvider({ children }) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] });
    socket.on('online_count', count => setOnlineCount(count));
    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ onlineCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
