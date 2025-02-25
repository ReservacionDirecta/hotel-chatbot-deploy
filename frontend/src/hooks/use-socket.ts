import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useAuth } from './use-auth';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    function initSocket() {
      try {
        // Obtener el token de las cookies
        const token = Cookies.get('auth-token');
        if (!token) {
          console.warn('No se encontró token de autenticación - esperando autenticación');
          return null;
        }
        
        if (!socket) {
          socket = io('http://localhost:4000/chat', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true,
            path: '/socket.io/chat',
            auth: {
              token
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
            timeout: 10000
          });

          console.log('Socket inicializado con token');
        }

        return socket;
      } catch (error) {
        console.error('Error al inicializar el socket:', error);
        return null;
      }
    }

    // Solo intentar inicializar el socket si el usuario está autenticado
    if (isAuthenticated) {
      const currentSocket = initSocket();

      if (currentSocket) {
        function onConnect() {
          console.log('WebSocket conectado');
          setIsConnected(true);
        }

        function onDisconnect(reason: string) {
          console.log('WebSocket desconectado:', reason);
          setIsConnected(false);
        }

        function onError(error: Error) {
          console.error('Error de WebSocket:', error);
        }

        function onConnectionError(error: Error) {
          console.error('Error de conexión WebSocket:', error);
          // Intentar reconectar después de un error
          setTimeout(() => {
            console.log('Intentando reconectar...');
            if (currentSocket && !currentSocket.connected) {
              currentSocket.connect();
            }
          }, 5000);
        }

        currentSocket.on('connect', onConnect);
        currentSocket.on('disconnect', onDisconnect);
        currentSocket.on('error', onError);
        currentSocket.on('connect_error', onConnectionError);

        // Forzar reconexión si no está conectado
        if (!currentSocket.connected) {
          console.log('Socket no conectado, intentando conectar...');
          currentSocket.connect();
        }

        return () => {
          currentSocket.off('connect', onConnect);
          currentSocket.off('disconnect', onDisconnect);
          currentSocket.off('error', onError);
          currentSocket.off('connect_error', onConnectionError);
        };
      }
    } else {
      // Si no está autenticado y existe un socket, desconectarlo
      if (socket) {
        socket.disconnect();
        socket = null;
        setIsConnected(false);
      }
    }
  }, [isAuthenticated]); // Agregar isAuthenticated como dependencia

  return socket;
} 