import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtService } from '@nestjs/jwt';
import { MessageService } from './message/message.service';
import { ConfigService } from '@nestjs/config';
import { MessageDto } from './message/dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']?.split(' ')[1];
    if (!token) throw new Error('Missing token');
    try {
      const payload = this.jwt.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      client.data.user = { id: payload.sub || payload.id };
      console.log(`Connected user: ${payload.id}`);
    } catch (err) {
      console.log('Socket auth failed:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    console.log(`User disconnected: ${socket.data.user?.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`chat:${chatId}`);
    console.log(`User ${socket.data.user.id} joined chat:${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.leave(`chat:${chatId}`);
    console.log(`User ${socket.data.user.id} left chat:${chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() dto: MessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.user.id;

    const message = await this.messageService.sendMessage(userId, dto);

    this.server.to(`chat:${message.chat.id}`).emit('new_message', message);

    return message;
  }
}
