import { Server, IncomingMessage, ServerResponse } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export function setupWebsocket(server: Server<typeof IncomingMessage, typeof ServerResponse>) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Cliente conectado via websocket: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emite a atualização salarial via websocket para todos os clientes conectados.
 * Atende ao RF-16 e RN-18/RN-19.
 * @param payload Dados com as métricas recalculadas.
 */
export function emitSalaryUpdate(payload: {
  globalAverage: number;
  updatedAt: string;
}) {
  if (io) {
    io.emit('salary:update', payload);
  }
}
