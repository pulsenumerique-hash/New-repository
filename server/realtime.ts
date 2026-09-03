import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth';
import { SyncEventPayload } from '../src/types';

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string;
  boutiqueId: string;
  role: string;
  sessionId: string;
  deviceId?: string;
  isAlive: boolean;
}

class RealtimeHub {
  private wss: WebSocketServer | null = null;
  private clients: Set<AuthenticatedClient> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/api/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      let clientInfo: AuthenticatedClient | null = null;

      // Check token in url query or wait for 'AUTH' message
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const token = url.searchParams.get('token');
        const deviceId = url.searchParams.get('deviceId') || 'dev_' + Math.random().toString(36).substring(2, 8);

        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            clientInfo = {
              ws,
              userId: decoded.id,
              boutiqueId: decoded.boutique_id,
              role: decoded.role,
              sessionId: decoded.session_id,
              deviceId,
              isAlive: true,
            };
            this.clients.add(clientInfo);
            this.send(ws, {
              type: 'CONNECTED',
              payload: { message: 'Connecté en temps réel', userId: decoded.id, boutiqueId: decoded.boutique_id },
            });
          }
        }
      } catch (err) {
        console.error('WS Connection error:', err);
      }

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'AUTH') {
            const token = parsed.token;
            const deviceId = parsed.deviceId || 'dev_' + Math.random().toString(36).substring(2, 8);
            const decoded = verifyToken(token);
            if (decoded) {
              if (clientInfo) {
                this.clients.delete(clientInfo);
              }
              clientInfo = {
                ws,
                userId: decoded.id,
                boutiqueId: decoded.boutique_id,
                role: decoded.role,
                sessionId: decoded.session_id,
                deviceId,
                isAlive: true,
              };
              this.clients.add(clientInfo);
              this.send(ws, {
                type: 'AUTH_SUCCESS',
                payload: { userId: decoded.id, boutiqueId: decoded.boutique_id },
              });
            } else {
              this.send(ws, { type: 'AUTH_FAILED', error: 'Token invalide' });
            }
          } else if (parsed.type === 'PONG') {
            if (clientInfo) clientInfo.isAlive = true;
          } else if (parsed.type === 'PING') {
            this.send(ws, { type: 'PONG' });
          }
        } catch {
          // ignore malformed message
        }
      });

      ws.on('pong', () => {
        if (clientInfo) clientInfo.isAlive = true;
      });

      ws.on('close', () => {
        if (clientInfo) {
          this.clients.delete(clientInfo);
        }
      });

      ws.on('error', () => {
        if (clientInfo) {
          this.clients.delete(clientInfo);
        }
      });
    });

    // Heartbeat check every 25 seconds
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        try {
          client.ws.ping();
          this.send(client.ws, { type: 'PING' });
        } catch {
          this.clients.delete(client);
        }
      });
    }, 25000);
  }

  private send(ws: WebSocket, data: unknown) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcastToBoutique(boutiqueId: string, event: SyncEventPayload, excludeWs?: WebSocket) {
    const message = JSON.stringify({
      type: 'SYNC_EVENT',
      payload: event,
    });

    let count = 0;
    this.clients.forEach((client) => {
      if (client.boutiqueId === boutiqueId && client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
        count++;
      }
    });
    return count;
  }

  broadcastSessionRevocation(sessionId: string) {
    const message = JSON.stringify({
      type: 'SESSION_REVOKED',
      payload: { sessionId },
    });

    this.clients.forEach((client) => {
      if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  getConnectedDevicesCount(boutiqueId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.boutiqueId === boutiqueId && client.ws.readyState === WebSocket.OPEN) {
        count++;
      }
    });
    return count;
  }
}

export const realtimeHub = new RealtimeHub();
