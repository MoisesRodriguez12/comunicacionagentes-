/**
 * Servicio de comunicación con agentes usando protocolos AG-UI y ACP
 * AG-UI: Protocolo de interfaz de usuario a agente
 * ACP: Protocolo de coordinación principal entre agentes
 */

class AgentService {
  constructor() {
    this.wsConnection = null;
    this.messageQueue = [];
    this.listeners = new Map();
    this.conversationIdCounter = 0;
    this.plannerAgentId = 'agent_planner@localhost';
    this.uiAgentId = 'agent_ui@localhost';
  }

  /**
   * Conectar al servidor de agentes mediante WebSocket
   */
  connect(url = 'ws://localhost:8081/ws') {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔄 [AG-UI] Iniciando conexión WebSocket a: ${url}`);
        this.wsConnection = new WebSocket(url);

        this.wsConnection.onopen = () => {
          console.log('✅ [AG-UI] Conexión WebSocket establecida correctamente');
          console.log(`🔗 [AG-UI] Conectado a: ${url}`);
          this.processQueue();
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 [AG-UI] Mensaje recibido:', message);
            this.handleIncomingMessage(message);
          } catch (error) {
            console.error('❌ [AG-UI] Error al procesar mensaje:', error);
          }
        };

        this.wsConnection.onerror = (error) => {
          console.error('🚨 [AG-UI] Error de conexión WebSocket:', error);
          console.error('🔍 [AG-UI] Verifique que el backend esté corriendo en:', url);
          reject(error);
        };

        this.wsConnection.onclose = (event) => {
          console.log('🔌 [AG-UI] Conexión WebSocket cerrada');
          console.log(`📊 [AG-UI] Código: ${event.code}, Razón: ${event.reason}`);
          
          // Solo reconectar si no fue cierre intencional
          if (event.code !== 1000) {
            console.log('🔄 [AG-UI] Intentando reconectar en 5 segundos...');
            setTimeout(() => {
              console.log('🔄 [AG-UI] Reintentando conexión...');
              this.connect(url).catch(err => {
                console.error('❌ [AG-UI] Falló la reconexión:', err);
              });
            }, 5000);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar ID único de conversación
   */
  generateConversationId() {
    return `conv-${Date.now()}-${++this.conversationIdCounter}`;
  }

  /**
   * Enviar mensaje al agente planificador usando protocolo AG-UI
   */
  sendToPlanner(eventData, action = 'plan-event') {
    const conversationId = this.generateConversationId();
    
    const message = {
      protocol: 'ag-ui',
      from: this.uiAgentId,
      to: this.plannerAgentId,
      body: JSON.stringify(eventData),
      metadata: {
        performative: 'request',
        'conversation-id': conversationId,
        action: action,
        type: 'event-planning',
        timestamp: new Date().toISOString()
      }
    };

    console.log('[AG-UI] Enviando solicitud al planificador:', message);
    this.sendMessage(message);
    
    return conversationId;
  }

  /**
   * Solicitar planificación de evento (descomposición en subtareas)
   */
  async requestEventPlanning(eventData) {
    const conversationId = this.sendToPlanner(eventData, 'plan-event');
    
    // Retornar promesa que se resolverá cuando el agente responda
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando respuesta del planificador'));
      }, 30000); // 30 segundos timeout

      this.addListener(conversationId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Solicitar estado de planificación
   */
  async getTaskStatus(taskId) {
    const conversationId = this.generateConversationId();
    
    const message = {
      protocol: 'ag-ui',
      from: this.uiAgentId,
      to: this.plannerAgentId,
      body: JSON.stringify({ taskId }),
      metadata: {
        performative: 'query',
        'conversation-id': conversationId,
        action: 'get-status',
        type: 'status-query',
        timestamp: new Date().toISOString()
      }
    };

    this.sendMessage(message);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando estado'));
      }, 10000);

      this.addListener(conversationId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Actualizar información de evento
   */
  updateEventInfo(eventId, updates) {
    const conversationId = this.generateConversationId();
    
    const message = {
      protocol: 'ag-ui',
      from: this.uiAgentId,
      to: this.plannerAgentId,
      body: JSON.stringify({ eventId, updates }),
      metadata: {
        performative: 'inform',
        'conversation-id': conversationId,
        action: 'update-event',
        type: 'event-update',
        timestamp: new Date().toISOString()
      }
    };

    this.sendMessage(message);
    return conversationId;
  }

  /**
   * Enviar mensaje al servidor
   */
  sendMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      try {
        this.wsConnection.send(JSON.stringify(message));
        console.log('📤 [AG-UI] Mensaje enviado exitosamente:', message);
      } catch (error) {
        console.error('❌ [AG-UI] Error enviando mensaje:', error);
        this.messageQueue.push(message);
      }
    } else {
      const status = this.wsConnection ? `Estado: ${this.wsConnection.readyState}` : 'No conectado';
      console.warn(`⏳ [AG-UI] Mensaje en cola - ${status}`);
      console.log('📝 [AG-UI] Mensaje encolado:', message);
      this.messageQueue.push(message);
    }
  }

  /**
   * Procesar cola de mensajes pendientes
   */
  processQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Manejar mensajes entrantes
   */
  handleIncomingMessage(message) {
    console.log('[AG-UI] Mensaje recibido:', message);
    
    const conversationId = message.metadata?.['conversation-id'];
    
    // Notificar a listeners específicos de la conversación
    if (conversationId && this.listeners.has(conversationId)) {
      const callbacks = this.listeners.get(conversationId);
      callbacks.forEach(callback => callback(message));
    }

    // Notificar a listeners globales
    if (this.listeners.has('*')) {
      const callbacks = this.listeners.get('*');
      callbacks.forEach(callback => callback(message));
    }

    // Manejar tipos de mensaje específicos
    const messageType = message.metadata?.type;
    
    switch (messageType) {
      case 'task-update':
        this.handleTaskUpdate(message);
        break;
      case 'task-complete':
        this.handleTaskComplete(message);
        break;
      case 'planning-response':
        this.handlePlanningResponse(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      default:
        console.log('[AG-UI] Tipo de mensaje no manejado:', messageType);
    }
  }

  /**
   * Manejar actualización de tarea
   */
  handleTaskUpdate(message) {
    console.log('[AG-UI] Actualización de tarea:', message.body);
    // Emitir evento personalizado para actualizar UI
    window.dispatchEvent(new CustomEvent('agent-task-update', { 
      detail: message 
    }));
  }

  /**
   * Manejar tarea completada
   */
  handleTaskComplete(message) {
    console.log('[AG-UI] Tarea completada:', message.body);
    window.dispatchEvent(new CustomEvent('agent-task-complete', { 
      detail: message 
    }));
  }

  /**
   * Manejar respuesta de planificación
   */
  handlePlanningResponse(message) {
    console.log('[AG-UI] Respuesta de planificación recibida:', message.body);
    try {
      const planningData = JSON.parse(message.body);
      window.dispatchEvent(new CustomEvent('agent-planning-response', { 
        detail: planningData 
      }));
    } catch (error) {
      console.error('[AG-UI] Error al parsear respuesta de planificación:', error);
    }
  }

  /**
   * Manejar error
   */
  handleError(message) {
    console.error('[AG-UI] Error del agente:', message.body);
    window.dispatchEvent(new CustomEvent('agent-error', { 
      detail: message 
    }));
  }

  /**
   * Agregar listener para mensajes
   */
  addListener(conversationId, callback) {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, []);
    }
    this.listeners.get(conversationId).push(callback);
  }

  /**
   * Remover listener
   */
  removeListener(conversationId, callback) {
    if (this.listeners.has(conversationId)) {
      const callbacks = this.listeners.get(conversationId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Agregar listener global
   */
  addGlobalListener(callback) {
    this.addListener('*', callback);
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

// Exportar instancia singleton
const agentService = new AgentService();
export default agentService;
