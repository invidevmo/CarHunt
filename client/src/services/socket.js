import { io } from 'socket.io-client';

const getServerUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (window.location.port === '5173') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname || 'localhost';
    const targetPort = protocol === 'https:' ? 3443 : 3001;
    return `${protocol}//${hostname}:${targetPort}`;
  }
  return window.location.origin;
};

export const socket = io(getServerUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
