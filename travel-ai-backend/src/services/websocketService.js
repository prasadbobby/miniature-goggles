// travel-ai-backend/src/services/websocketService.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  verifyClient(info) {
    const url = new URL(info.req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) return false;

    try {
      jwt.verify(token, config.jwt.secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  handleConnection(ws, req) {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const userId = decoded.userId;
      
      this.clients.set(userId, ws);
      logger.info(`WebSocket client connected: ${userId}`);

      ws.on('close', () => {
        this.clients.delete(userId);
        logger.info(`WebSocket client disconnected: ${userId}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${userId}:`, error);
        this.clients.delete(userId);
      });

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connection',
        message: 'Connected to TravelAI real-time updates'
      });

    } catch (error) {
      ws.close();
    }
  }

  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  broadcastItineraryUpdate(userId, itineraryId, status, progress) {
    this.sendToUser(userId, {
      type: 'itinerary_update',
      itineraryId,
      status,
      progress,
      timestamp: new Date().toISOString()
    });
  }

  broadcastBookingUpdate(userId, bookingId, status) {
    this.sendToUser(userId, {
      type: 'booking_update',
      bookingId,
      status,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new WebSocketService();