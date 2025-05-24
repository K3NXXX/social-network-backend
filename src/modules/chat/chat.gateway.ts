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
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: true,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private messageService: MessageService,
    private chatService: ChatService,
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
  handleJoinRoom(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(chatId);
    console.log(`Joined room ${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(chatId);
    console.log(`User ${client.data.user.id} left chat:${chatId}`);
  }

  @SubscribeMessage('newMessage')
  async handleSendMessage(@MessageBody() dto: MessageDto) {
    const message = await this.messageService.sendMessage(dto);
    const chat = await this.chatService.getChatByMessageId(message.id);

    this.server.to(chat?.id as string).emit('message', message);
  }
}
