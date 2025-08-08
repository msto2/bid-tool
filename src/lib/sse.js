// SSE connection management
let sseConnections = new Set();

export function addSSEConnection(controller) {
  const connection = { 
    controller,
    isActive: true,
    lastActivity: Date.now()
  };
  sseConnections.add(connection);
  
  return () => {
    connection.isActive = false;
    sseConnections.delete(connection);
  };
}

export function broadcastToSSEClients(data) {
  if (sseConnections.size === 0) return;
  
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const now = Date.now();
  
  // Clean up inactive connections first
  const toRemove = [];
  
  sseConnections.forEach(connection => {
    // Check if connection is still active and not too old
    if (!connection.isActive || (now - connection.lastActivity > 300000)) { // 5 minutes timeout
      toRemove.push(connection);
      return;
    }
    
    try {
      // Check if controller is still writable
      if (connection.controller.desiredSize !== null) {
        connection.controller.enqueue(message);
        connection.lastActivity = now;
      } else {
        toRemove.push(connection);
      }
    } catch (error) {
      // Connection is closed or invalid
      toRemove.push(connection);
    }
  });
  
  // Remove inactive connections
  toRemove.forEach(connection => {
    sseConnections.delete(connection);
  });
}