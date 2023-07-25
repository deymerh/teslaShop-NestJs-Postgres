import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesWsService } from './messages-ws.service';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() webSocketServer: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesWsService: MessagesWsService
  ) { }

  async handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.headers.autentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return;
    }

    this.webSocketServer.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClinet(client.id);
    this.webSocketServer.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto) {

    // Emite a todos INCLUYENDO al cliente inicial que envió el mensaje
    this.webSocketServer.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message!!'
    });
    
    // Emite UNICAMENTE al cliente conectado que envio el mensaje
    // client.emit('message-from-server',  {
    //   fullName: 'Deymer',
    //   message: payload.message || 'no-message!!'
    // });

    // Emite a todos MENOS al cliente inicial que envió el mensaje
    // client.broadcast.emit('message-from-server',  {
    //   fullName: 'Deymer',
    //   message: payload.message || 'no-message!!'
    // });

  }



}
