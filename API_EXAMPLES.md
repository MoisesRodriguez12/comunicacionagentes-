# Ejemplos de Uso de la API

Este documento contiene ejemplos practicos de como usar la API del sistema multiagente.

## Base URL

```
http://localhost:8000
```

## Autenticacion

Actualmente no se requiere autenticacion. En una version de produccion, se deberia implementar JWT o similar.

---

## 1. Crear un Evento y Generar Plan

**Endpoint**: `POST /api/plan`

**Descripcion**: Crea un nuevo evento y automaticamente genera un plan usando el agente Planificador.

**Request Body**:
```json
{
  "event_name": "Torneo de Matematicas 2025",
  "event_type": "academico",
  "event_date": "2025-12-20",
  "expected_attendees": 150,
  "budget": 3000,
  "description": "Torneo interescolar de matematicas para estudiantes de secundaria",
  "organizer_email": "profesor.mat@escuela.edu"
}
```

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:30:00.123456",
  "message_id": "uuid-here",
  "sender": "Planificador",
  "receiver": "UI",
  "message_type": "response",
  "action": "Plan",
  "status": "success",
  "payload": {
    "event_id": "event-uuid",
    "plan": {
      "plan_id": "plan-uuid",
      "event_id": "event-uuid",
      "plan_summary": "Plan completo para organizar el Torneo de Matematicas",
      "total_tasks": 5,
      "estimated_duration": "2-3 semanas",
      "tasks": [
        {
          "task_id": "plan-uuid-task-1",
          "task_name": "Reservar espacio para el torneo",
          "description": "Reservar auditorio con capacidad para 150 personas",
          "priority": 5,
          "dependencies": [],
          "parameters": {
            "action": "reserve_space",
            "capacity": 150
          }
        }
      ],
      "status": "created",
      "created_at": "2025-11-12T10:30:00"
    },
    "notification_id": "notif-uuid"
  }
}
```

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Torneo de Matematicas 2025",
    "event_type": "academico",
    "event_date": "2025-12-20",
    "expected_attendees": 150,
    "budget": 3000,
    "description": "Torneo interescolar de matematicas",
    "organizer_email": "profesor.mat@escuela.edu"
  }'
```

**Ejemplo con PowerShell**:
```powershell
$body = @{
    event_name = "Torneo de Matematicas 2025"
    event_type = "academico"
    event_date = "2025-12-20"
    expected_attendees = 150
    budget = 3000
    description = "Torneo interescolar de matematicas"
    organizer_email = "profesor.mat@escuela.edu"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/plan" -Method Post -Body $body -ContentType "application/json"
```

---

## 2. Ejecutar un Plan

**Endpoint**: `POST /api/execute/{plan_id}`

**Descripcion**: Ejecuta todas las tareas de un plan usando el agente Ejecutor.

**Parametros de URL**:
- `plan_id`: ID del plan a ejecutar

**Request**: No requiere body

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:35:00.123456",
  "message_id": "uuid-here",
  "sender": "Ejecutor",
  "receiver": "UI",
  "message_type": "response",
  "action": "Ejecutar",
  "status": "success",
  "payload": {
    "execution_id": "exec-uuid",
    "results": [
      {
        "protocol": "ANP",
        "message_id": "uuid",
        "sender": "Ejecutor",
        "receiver": "Planificador",
        "message_type": "task_result",
        "task_id": "task-1",
        "status": "success",
        "result": {
          "status": "success",
          "action_taken": "Espacio reservado exitosamente",
          "details": {
            "space_id": "SPACE-abc123",
            "capacity": 150,
            "reservation_confirmed": true
          },
          "observations": "Reservacion confirmada para fecha solicitada",
          "next_steps": "Proceder con contratacion de servicios"
        },
        "execution_time": 2.34
      }
    ],
    "notification_id": "notif-uuid"
  }
}
```

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:8000/api/execute/plan-uuid-here
```

**Ejemplo con PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/execute/plan-uuid-here" -Method Post
```

---

## 3. Listar Todos los Eventos

**Endpoint**: `GET /api/events`

**Descripcion**: Obtiene lista de todos los eventos almacenados en la base de datos.

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:40:00.123456",
  "message_id": "uuid-here",
  "sender": "Database",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "events": [
      {
        "event_id": "event-1",
        "event_name": "Feria de Ciencias 2025",
        "event_type": "academico",
        "event_date": "2025-12-15",
        "expected_attendees": 200,
        "budget": 5000,
        "description": "Feria anual de ciencias",
        "organizer_email": "org@escuela.edu",
        "status": "planning",
        "created_at": "2025-11-12T10:00:00"
      }
    ]
  }
}
```

**Ejemplo con cURL**:
```bash
curl http://localhost:8000/api/events
```

**Ejemplo con PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/events" -Method Get
```

---

## 4. Obtener Detalles de un Evento Especifico

**Endpoint**: `GET /api/events/{event_id}`

**Descripcion**: Obtiene detalles completos de un evento especifico.

**Parametros de URL**:
- `event_id`: ID del evento

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:42:00.123456",
  "message_id": "uuid-here",
  "sender": "Database",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "event": {
      "event_id": "event-1",
      "event_name": "Feria de Ciencias 2025",
      "event_type": "academico",
      "event_date": "2025-12-15",
      "expected_attendees": 200,
      "budget": 5000,
      "description": "Feria anual de ciencias para estudiantes",
      "organizer_email": "org@escuela.edu",
      "status": "planning",
      "created_at": "2025-11-12T10:00:00"
    }
  }
}
```

**Ejemplo con cURL**:
```bash
curl http://localhost:8000/api/events/event-uuid-here
```

---

## 5. Listar Todos los Planes

**Endpoint**: `GET /api/plans`

**Descripcion**: Obtiene lista de todos los planes generados.

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:45:00.123456",
  "message_id": "uuid-here",
  "sender": "Planificador",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "plans": [
      {
        "plan_id": "plan-1",
        "event_id": "event-1",
        "plan_summary": "Plan para Feria de Ciencias",
        "total_tasks": 5,
        "estimated_duration": "3 semanas",
        "status": "created",
        "tasks": [],
        "created_at": "2025-11-12T10:30:00"
      }
    ]
  }
}
```

**Ejemplo con cURL**:
```bash
curl http://localhost:8000/api/plans
```

---

## 6. Obtener Detalles de un Plan

**Endpoint**: `GET /api/plans/{plan_id}`

**Descripcion**: Obtiene detalles completos de un plan incluyendo todas sus tareas.

**Response**: Similar al endpoint anterior pero con un solo plan y todas sus tareas detalladas.

---

## 7. Obtener Notificaciones

**Endpoint**: `GET /api/notifications`

**Descripcion**: Obtiene todas las notificaciones pendientes e historial.

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:50:00.123456",
  "message_id": "uuid-here",
  "sender": "Notificador",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "pending": [],
    "history": [
      {
        "notification_id": "notif-1",
        "type": "planning",
        "level": "success",
        "title": "Plan Creado",
        "body": "Se ha creado un plan con 5 tareas",
        "data": {
          "plan_id": "plan-1",
          "event_id": "event-1"
        },
        "read": false,
        "created_at": "2025-11-12T10:30:00"
      }
    ]
  }
}
```

**Ejemplo con cURL**:
```bash
curl http://localhost:8000/api/notifications
```

---

## 8. Crear un Usuario

**Endpoint**: `POST /api/users`

**Descripcion**: Registra un nuevo usuario en el sistema.

**Request Body**:
```json
{
  "name": "Juan Perez",
  "email": "juan.perez@estudiante.edu",
  "role": "estudiante"
}
```

**Roles validos**:
- `estudiante`
- `organizador`
- `administrador`

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T11:00:00.123456",
  "message_id": "uuid-here",
  "sender": "Database",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "user": {
      "user_id": "user-uuid",
      "name": "Juan Perez",
      "email": "juan.perez@estudiante.edu",
      "role": "estudiante",
      "created_at": "2025-11-12T11:00:00"
    }
  }
}
```

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Perez",
    "email": "juan.perez@estudiante.edu",
    "role": "estudiante"
  }'
```

---

## 9. Listar Usuarios

**Endpoint**: `GET /api/users`

**Descripcion**: Obtiene lista de todos los usuarios registrados.

**Response**: Similar a listar eventos, pero con datos de usuarios.

---

## 10. Registrar Asistencia a un Evento

**Endpoint**: `POST /api/events/{event_id}/attend`

**Descripcion**: Registra la asistencia de un usuario a un evento.

**Request Body**:
```json
{
  "event_id": "event-uuid",
  "user_email": "juan.perez@estudiante.edu"
}
```

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T11:05:00.123456",
  "message_id": "uuid-here",
  "sender": "Database",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "attendance": {
      "attendance_id": "attendance-uuid",
      "event_id": "event-uuid",
      "user_email": "juan.perez@estudiante.edu",
      "registered_at": "2025-11-12T11:05:00",
      "status": "confirmed"
    },
    "notification_id": "notif-uuid"
  }
}
```

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:8000/api/events/event-uuid/attend \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "user_email": "juan.perez@estudiante.edu"
  }'
```

---

## 11. Listar Ejecuciones

**Endpoint**: `GET /api/executions`

**Descripcion**: Obtiene historial de todas las ejecuciones de planes.

**Response** (protocolo AG-UI):
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T11:10:00.123456",
  "message_id": "uuid-here",
  "sender": "Ejecutor",
  "receiver": "UI",
  "message_type": "response",
  "action": "Base de datos",
  "status": "success",
  "payload": {
    "current": [],
    "history": [
      {
        "execution_id": "exec-uuid",
        "plan_id": "plan-uuid",
        "status": "completed",
        "received_at": "2025-11-12T10:35:00",
        "started_at": "2025-11-12T10:35:01",
        "completed_at": "2025-11-12T10:35:15",
        "results": []
      }
    ]
  }
}
```

---

## 12. Obtener Estado de una Ejecucion

**Endpoint**: `GET /api/executions/{execution_id}`

**Descripcion**: Obtiene detalles completos de una ejecucion especifica.

**Parametros de URL**:
- `execution_id`: ID de la ejecucion

**Response**: Similar al anterior pero con una sola ejecucion y todos sus resultados.

---

## Documentacion Interactiva

FastAPI proporciona documentacion interactiva automatica en:

**Swagger UI**: http://localhost:8000/docs

**ReDoc**: http://localhost:8000/redoc

Estas interfaces permiten:
- Ver todos los endpoints disponibles
- Probar la API directamente desde el navegador
- Ver esquemas de request/response
- Ejecutar peticiones de prueba

---

## Codigos de Estado HTTP

- `200 OK`: Operacion exitosa
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## Notas Importantes

1. Todos los endpoints retornan mensajes en formato de protocolo AG-UI
2. Los IDs son UUIDs generados automaticamente
3. Las fechas estan en formato ISO 8601
4. El sistema utiliza MongoDB para persistencia
5. Las operaciones son asincronicas y no bloqueantes
