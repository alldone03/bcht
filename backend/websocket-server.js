const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper to parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
      if (match) {
        let val = match[2].trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    });
  }
}
loadEnv();

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'http://10.160.7.15:1234/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-lm-6rZwLqvG:R9dpb2snWaL3XW9vpeq7';

// Track all active sockets to broadcast LLM status
const allSockets = new Set();
let llmActive = false;

// Map of sessionId -> Set of socket connections
const subscriptions = new Map();

const server = http.createServer((req, res) => {
  // REST API bridge endpoint for Laravel
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { sessionId, event, data } = payload;
        
        console.log(`[Broadcast] Session ${sessionId}, Event: ${event}`);
        
        const subs = subscriptions.get(Number(sessionId));
        if (subs && subs.size > 0) {
          const messageStr = JSON.stringify({ event, data });
          for (const socket of subs) {
            sendFrame(socket, messageStr);
          }
          console.log(`[Broadcast] Distributed to ${subs.size} client(s)`);
        } else {
          console.log(`[Broadcast] No clients subscribed to session ${sessionId}`);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[Broadcast Error]', err);
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  
  // RFC 6455 Handshake
  const hash = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
    
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Accept: ' + hash,
    ''
  ].join('\r\n');
  
  socket.write(responseHeaders);
  console.log('[WS] Client connected');
  
  allSockets.add(socket);
  // Send current LLM status immediately to newly connected client
  sendFrame(socket, JSON.stringify({ event: 'llm_status', data: { active: llmActive } }));
  
  let currentSessionId = null;
  
  const trackClient = (sessionId) => {
    untrackClient();
    currentSessionId = Number(sessionId);
    if (!subscriptions.has(currentSessionId)) {
      subscriptions.set(currentSessionId, new Set());
    }
    subscriptions.get(currentSessionId).add(socket);
    console.log(`[WS] Client subscribed to session ${currentSessionId}. Total in session: ${subscriptions.get(currentSessionId).size}`);
  };
  
  const untrackClient = () => {
    allSockets.delete(socket);
    if (currentSessionId !== null && subscriptions.has(currentSessionId)) {
      subscriptions.get(currentSessionId).delete(socket);
      console.log(`[WS] Client unsubscribed from session ${currentSessionId}. Remaining in session: ${subscriptions.get(currentSessionId).size}`);
      if (subscriptions.get(currentSessionId).size === 0) {
        subscriptions.delete(currentSessionId);
      }
      currentSessionId = null;
    }
  };

  let buffer = Buffer.alloc(0);
  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const byte1 = buffer[0];
      const byte2 = buffer[1];
      const op = byte1 & 0x0f;
      const isMasked = (byte2 & 0x80) !== 0;
      let payloadLength = byte2 & 0x7f;
      let headerOffset = 2;
      
      if (payloadLength === 126) {
        if (buffer.length < 4) break;
        payloadLength = buffer.readUInt16BE(2);
        headerOffset = 4;
      } else if (payloadLength === 127) {
        if (buffer.length < 10) break;
        payloadLength = Number(buffer.readBigUInt64BE(2));
        headerOffset = 10;
      }
      
      const maskSize = isMasked ? 4 : 0;
      const totalFrameSize = headerOffset + maskSize + payloadLength;
      if (buffer.length < totalFrameSize) break;
      
      let mask;
      if (isMasked) {
        mask = buffer.slice(headerOffset, headerOffset + 4);
      }
      
      const payloadStart = headerOffset + maskSize;
      const payload = buffer.slice(payloadStart, payloadStart + payloadLength);
      
      // Opcode 8: Connection Close Frame
      if (op === 8) {
        untrackClient();
        socket.end();
        return;
      }
      
      // Opcode 9: Ping Frame
      if (op === 9) {
        const pongHeader = Buffer.alloc(2);
        pongHeader[0] = 0x8a; // FIN + Pong Opcode
        pongHeader[1] = 0x00; // 0 length
        socket.write(pongHeader);
      }
      
      // Opcode 1: Text Frame
      if (op === 1) {
        let text = '';
        if (isMasked) {
          for (let i = 0; i < payload.length; i++) {
            text += String.fromCharCode(payload[i] ^ mask[i % 4]);
          }
        } else {
          text = payload.toString('utf8');
        }
        
        try {
          const msg = JSON.parse(text);
          if (msg.type === 'subscribe' && msg.sessionId) {
            trackClient(msg.sessionId);
          }
        } catch (e) {
          console.error('[WS Data Error] Failed to parse message:', text, e);
        }
      }
      
      buffer = buffer.slice(totalFrameSize);
    }
  });
  
  socket.on('close', () => {
    console.log('[WS] Client disconnected');
    untrackClient();
  });
  
  socket.on('error', (err) => {
    console.error('[WS Socket Error]', err);
    untrackClient();
  });
});

function sendFrame(socket, text) {
  try {
    const payload = Buffer.from(text, 'utf8');
    const len = payload.length;
    let header;
    if (len <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + Text Opcode
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    socket.write(Buffer.concat([header, payload]));
  } catch (err) {
    console.error('[Send Frame Error]', err);
  }
}

async function checkLlmStatus() {
  const url = `${OPENAI_BASE_URL}/models`;
  try {
    const headers = {};
    if (OPENAI_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(url, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const active = res.ok;
    if (active !== llmActive) {
      llmActive = active;
      console.log(`[LLM Status] Changed to: ${llmActive ? 'ACTIVE' : 'OFFLINE'}`);
      broadcastLlmStatus();
    }
  } catch (err) {
    if (llmActive !== false) {
      llmActive = false;
      console.log('[LLM Status] Changed to: OFFLINE');
      broadcastLlmStatus();
    }
  }
}

function broadcastLlmStatus() {
  const msg = JSON.stringify({ event: 'llm_status', data: { active: llmActive } });
  for (const socket of allSockets) {
    sendFrame(socket, msg);
  }
}

// Initial status check
checkLlmStatus();

// Check status every 5 seconds if there are connected clients
setInterval(() => {
  if (allSockets.size > 0) {
    checkLlmStatus();
  }
}, 5000);

const PORT = 6001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
