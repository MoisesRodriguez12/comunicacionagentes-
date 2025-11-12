# Documentación Técnica de Protocolos de Comunicación

## Sistema Multi-Agente de Gestión de Eventos Universitarios

---

## 1. Arquitectura de Comunicación

El sistema implementa una arquitectura multi-agente basada en protocolos de comunicación estandarizados para permitir la interacción entre diferentes componentes del sistema.

```
┌─────────────────┐
│   UI (React)    │
│  agent_ui       │
└────────┬────────┘
         │ AG-UI Protocol
         ↓
┌─────────────────┐      ┌─────────────────┐
│  WebSocket      │←────→│   Planner       │
│  Server         │      │   (Gemini)      │
└─────────────────┘      └────────┬────────┘
         ↑                         │ ACP Protocol
         │                         ↓
         │                ┌─────────────────┐
         │                │   Executor      │
         │                │   Agent         │
         │                └────────┬────────┘
         │                         │
         │                         ↓
         │                ┌─────────────────┐
         └───────────────→│  Notifier       │
                 ANP      │  Agent          │
                          └─────────────────┘
```

---

## 2. Protocolo AG-UI (Agent-GUI Communication)

### 2.1 Descripción

Protocolo especializado para la comunicación entre la interfaz de usuario (UI) y los agentes del sistema. Permite que el frontend envíe solicitudes y reciba respuestas de manera asíncrona.

### 2.2 Estructura de Mensaje

```javascript
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "string | JSON",
  "metadata": {
    "performative": "request | inform | query",
    "conversation-id": "unique-id",
    "action": "plan-event | get-status | update-event",
    "type": "event-planning | status-query | event-update",
    "timestamp": "ISO-8601"
  }
}
```

### 2.3 Tipos de Performatives

| Performative | Descripción | Dirección |
|-------------|-------------|-----------|
| `request` | Solicitud de acción al agente | UI → Agente |
| `inform` | Informar actualización | Agente → UI |
| `query` | Consulta de información | UI ↔ Agente |

### 2.4 Acciones Disponibles

#### plan-event
**Dirección**: UI → Planner Agent

Solicita al agente planificador que descomponga un evento en subtareas.

**Request:**
```json
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "{\"eventId\":\"event-123\",\"title\":\"Hackathon\",\"date\":\"2025-12-01\"}",
  "metadata": {
    "performative": "request",
    "conversation-id": "conv-1234567890",
    "action": "plan-event",
    "type": "event-planning",
    "timestamp": "2025-11-11T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "protocol": "ag-ui",
  "from": "agent_planner@localhost",
  "to": "agent_ui@localhost",
  "body": "{\"eventId\":\"event-123\",\"tasks\":[...],\"status\":\"planning_complete\"}",
  "metadata": {
    "conversation-id": "conv-1234567890",
    "type": "planning-response",
    "status": "success",
    "timestamp": "2025-11-11T10:00:02Z"
  }
}
```

#### get-status
**Dirección**: UI → Planner Agent

Consulta el estado de una tarea específica.

**Request:**
```json
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "{\"taskId\":\"event-123-task-1\"}",
  "metadata": {
    "performative": "query",
    "conversation-id": "conv-status-123",
    "action": "get-status",
    "type": "status-query",
    "timestamp": "2025-11-11T10:05:00Z"
  }
}
```

#### update-event
**Dirección**: UI → Planner Agent

Actualiza información de un evento.

**Request:**
```json
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "{\"eventId\":\"event-123\",\"updates\":{\"status\":\"approved\"}}",
  "metadata": {
    "performative": "inform",
    "conversation-id": "conv-update-456",
    "action": "update-event",
    "type": "event-update",
    "timestamp": "2025-11-11T10:10:00Z"
  }
}
```

### 2.5 Notificaciones del Agente

El agente puede enviar actualizaciones proactivas al UI:

#### task-update
```json
{
  "protocol": "ag-ui",
  "from": "agent_planner@localhost",
  "to": "agent_ui@localhost",
  "body": "Tarea en progreso: Reservar espacio",
  "metadata": {
    "conversation-id": "conv-1234567890-update-1",
    "type": "task-update",
    "status": "in_progress",
    "task-id": "event-123-task-1",
    "task-name": "Reservar espacio",
    "timestamp": "2025-11-11T10:03:00Z"
  }
}
```

#### task-complete
```json
{
  "protocol": "ag-ui",
  "from": "agent_planner@localhost",
  "to": "agent_ui@localhost",
  "body": "Tarea completada: Reservar espacio",
  "metadata": {
    "conversation-id": "conv-1234567890-complete-1",
    "type": "task-complete",
    "status": "completed",
    "task-id": "event-123-task-1",
    "timestamp": "2025-11-11T10:15:00Z"
  }
}
```

---

## 3. Protocolo ACP (Agent Coordination Protocol)

### 3.1 Descripción

Protocolo para coordinación entre agentes del sistema. Permite que los agentes se comuniquen entre sí para distribuir tareas y compartir información.

### 3.2 Estructura de Mensaje

```javascript
{
  "protocol": "acp",
  "from": "agent_sender@localhost",
  "to": "agent_receiver@localhost",
  "body": "string | JSON",
  "metadata": {
    "performative": "request | inform | delegate",
    "conversation-id": "unique-id",
    "phase": "planning | execution | completion",
    "priority": "high | medium | low",
    "timestamp": "ISO-8601"
  }
}
```

### 3.3 Flujo de Coordinación

```
Coordinator Agent
       │
       │ ACP: request
       ↓
Planner Agent
       │
       │ ACP: delegate (phase: execution)
       ↓
Executor Agent
       │
       │ ACP: query (resources)
       ↓
Knowledge Base Agent
       │
       │ ACP: inform (response)
       ↓
Executor Agent
       │
       │ ACP: inform (completion)
       ↓
Coordinator Agent
```

### 3.4 Ejemplo de Coordinación

#### Planner → Executor (Delegar tarea)
```json
{
  "protocol": "acp",
  "from": "agent_planner@localhost",
  "to": "agent_executor@localhost",
  "body": "Reservar Auditorio Principal para 2025-12-15",
  "metadata": {
    "performative": "delegate",
    "conversation-id": "coord-event-123",
    "phase": "execution",
    "priority": "high",
    "task-id": "event-123-task-1",
    "timestamp": "2025-11-11T10:00:00Z"
  }
}
```

#### Executor → Knowledge Base (Consultar recursos)
```json
{
  "protocol": "acp",
  "from": "agent_executor@localhost",
  "to": "agent_kb@localhost",
  "body": "recursos_disponibles",
  "metadata": {
    "performative": "query",
    "conversation-id": "coord-event-123-kb",
    "query-type": "recursos",
    "timestamp": "2025-11-11T10:01:00Z"
  }
}
```

---

## 4. Protocolo ANP (Agent Notification and Planning)

### 4.1 Descripción

Protocolo especializado para notificaciones y planificación entre el Planner y otros agentes.

### 4.2 Estructura de Mensaje

```javascript
{
  "protocol": "anp",
  "from": "agent_sender@localhost",
  "to": "agent_receiver@localhost",
  "body": "string | JSON",
  "metadata": {
    "performative": "delegate | notify",
    "conversation-id": "unique-id",
    "task-type": "subtask | notification",
    "planning-phase": "execution | monitoring",
    "timestamp": "ISO-8601"
  }
}
```

### 4.3 Ejemplo ANP

```json
{
  "protocol": "anp",
  "from": "agent_planner@localhost",
  "to": "agent_executor@localhost",
  "body": "subtarea: Contratar servicios de catering",
  "metadata": {
    "performative": "delegate",
    "conversation-id": "anp-event-123-2",
    "task-type": "subtask",
    "planning-phase": "execution",
    "timestamp": "2025-11-11T10:05:00Z"
  }
}
```

---

## 5. Implementación en el Sistema

### 5.1 Frontend (agentService.js)

```javascript
class AgentService {
  // Conectar vía WebSocket
  connect(url = 'ws://localhost:8080') { ... }
  
  // Enviar mensaje AG-UI al planificador
  sendToPlanner(eventData, action = 'plan-event') { ... }
  
  // Solicitar planificación de evento
  async requestEventPlanning(eventData) { ... }
  
  // Obtener estado de tarea
  async getTaskStatus(taskId) { ... }
  
  // Actualizar información de evento
  updateEventInfo(eventId, updates) { ... }
}
```

### 5.2 Backend (backend_api.py)

```python
class PlannerAgent:
    async def process_event_planning(self, event_data, conversation_id):
        """Descompone evento en subtareas"""
        # Lógica de planificación
        return subtasks

class WebSocketServer:
    async def handle_ag_ui_protocol(self, message, ws):
        """Maneja protocolo AG-UI"""
        # Procesar según action
        
    async def handle_acp_protocol(self, message, ws):
        """Maneja protocolo ACP"""
        # Coordinación entre agentes
```

---

## 6. Manejo de Errores

### 6.1 Error en AG-UI

```json
{
  "protocol": "ag-ui",
  "from": "agent_planner@localhost",
  "to": "agent_ui@localhost",
  "body": "{\"error\":\"Invalid event data\"}",
  "metadata": {
    "conversation-id": "conv-error-123",
    "type": "error",
    "status": "failed",
    "error-code": "INVALID_DATA",
    "timestamp": "2025-11-11T10:00:00Z"
  }
}
```

### 6.2 Timeout

Si no hay respuesta en 30 segundos, el frontend debe:
1. Mostrar mensaje de timeout
2. Permitir reintento
3. Ofrecer modo offline

---

## 7. Seguridad

### 7.1 Validación de Mensajes

- Verificar estructura JSON
- Validar campos requeridos
- Sanitizar datos de entrada
- Verificar origen del mensaje

### 7.2 Autenticación (Futura)

```json
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "...",
  "metadata": {
    "auth-token": "JWT-TOKEN",
    "user-id": "user-123",
    ...
  }
}
```

---

## 8. Monitoreo y Debugging

### 8.1 Logs del Sistema

Todos los mensajes se registran en:
- Frontend: Console del navegador
- Backend: Logs del servidor Python

### 8.2 Monitor en UI

El Dashboard incluye un panel de monitoreo que muestra:
- Estado de conexión de agentes
- Mensajes AG-UI en tiempo real
- Historial de comunicaciones

---

## 9. Extensibilidad

El sistema está diseñado para agregar fácilmente:

### 9.1 Nuevos Protocolos

```javascript
// Ejemplo: Protocolo de Feedback (AFP)
{
  "protocol": "afp",
  "from": "agent_feedback@localhost",
  "to": "agent_ui@localhost",
  "body": "...",
  "metadata": {
    "type": "student-feedback",
    ...
  }
}
```

### 9.2 Nuevos Agentes

1. Crear clase del agente en backend
2. Registrar en WebSocketServer
3. Actualizar agentService.js si necesario
4. Documentar protocolo específico

---

## 10. Referencias

- FIPA ACL: http://www.fipa.org/specs/fipa00061/
- SPADE Framework: https://spade-mas.readthedocs.io/
- WebSocket Protocol: https://tools.ietf.org/html/rfc6455

---

**Última actualización**: 11 de Noviembre, 2025
