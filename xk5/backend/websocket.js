const WebSocket = require('ws');
const url = require('url');
const db = require('./config/database');

// Store connected clients: userId -> WebSocket
const clients = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const match = /^\/api\/ws\/chat\/(\d+)$/.exec(parsedUrl.pathname || '');
      if (!match) {
        ws.close(1008, 'Invalid WebSocket path');
        return;
      }
      const userId = Number(match[1]);

      // Register client
      clients.set(userId, ws);
      ws.userId = userId;

      console.log(`User ${userId} connected via WebSocket`);

      ws.on('message', async (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log('Received message:', parsedMessage);

          if (parsedMessage.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          const { receiverId, content, type } = parsedMessage;
          const senderId = userId;
          
          // Save to database
          if (receiverId && content) {
            try {
              await db.query(
                'INSERT INTO messages (sender_id, receiver_id, content, type, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [senderId, receiverId, content, type || 'text', 'sent']
              );
              console.log('Message saved to database');
            } catch (dbError) {
              console.error('Failed to save message to DB:', dbError.message);
            }
          }

          // Forward to receiver if online
          const receiverWs = clients.get(Number(receiverId));
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            const forwardMessage = {
              id: Date.now(), // Should use DB ID in real app
              senderId: senderId,
              receiverId: Number(receiverId),
              content: content,
              type: type || 'text',
              time: Date.now()
            };
            receiverWs.send(JSON.stringify(forwardMessage));
            console.log(`Message forwarded to user ${receiverId}`);
          } else {
             console.log(`User ${receiverId} offline, message saved`);
          }

        } catch (e) {
          console.error('Error processing message:', e);
        }
      });

      ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        clients.delete(userId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

    } catch (err) {
      console.error('WebSocket connection failed:', err.message);
      ws.close(1008, 'Connection failed');
    }
  });

  return wss;
}

module.exports = setupWebSocket;
