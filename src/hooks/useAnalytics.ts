import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useAnalytics() {
  const [isConnected, setIsConnected] = useState(false);
  const { payloadToken } = useAuth();
  type MyPayload = { wallet_id?: number };
  const walletId = (payloadToken as MyPayload)?.wallet_id || 0;

  useEffect(() => {
    // Connect to WebSocket server
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/admin`, {
      query: {
        walletId,
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    // Handle connection events
    socket.on('connect', () => {
      setIsConnected(true);
    });

    // Handle disconnection events
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    // Cleanup when component unmounts
    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, []);

  return { isConnected };
}