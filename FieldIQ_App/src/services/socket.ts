import { io, Socket } from 'socket.io-client';
import { LocationCoordinates } from '../types';

const SOCKET_URL = 'http://10.0.2.2:3000'; // Default Node.js Socket server

class SocketService {
  private socket: Socket | null = null;

  public connect(employeeId: string) {
    if (this.socket && this.socket.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { employeeId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket Disconnected');
    });
  }

  public emitLocationUpdate(employeeId: string, location: LocationCoordinates) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('employee:location', {
        employeeId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
        timestamp: Date.now(),
      });
    }
  }

  public subscribeToRouteDispatches(callback: (routeData: any) => void) {
    if (this.socket) {
      this.socket.on('route:dispatched', callback);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
