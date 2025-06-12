import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); 

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) this.connectedUsers.set(client.id, userId);
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  sendNotification(userId: string, payload: any) {
    for (const [socketId, id] of this.connectedUsers.entries()) {
      if (id === userId) {
        this.server.to(socketId).emit('notification', payload);
      }
    }
  }
}
