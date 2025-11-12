# Arquitectura del Sistema Multiagente

## Diagrama de Comunicacion entre Agentes

```
+------------------+
|                  |
|   USUARIO (UI)   |
|   React + Vite   |
|                  |
+--------+---------+
         |
         | AG-UI Protocol
         | (request/response/notification)
         |
+--------v---------+
|                  |
|   FastAPI API    |
|   Coordinador    |
|                  |
+--+---+---+---+---+
   |   |   |   |
   |   |   |   +------------------+
   |   |   |                      |
   |   |   +------------+         |
   |   |                |         |
   |   |  A2A Protocol  |  ANP    |  ACP Protocol
   |   |  (inform/      |  (task  |  (read/write/
   |   |   event)       |   msgs) |   update/delete)
   |   |                |         |
+--v---v-------+  +-----v----+  +-v-----------+
|              |  |          |  |             |
| PLANIFICADOR |  | EJECUTOR |  | BASE DATOS  |
| (Gemini 2.0) |  |(Gemini2.0|  | (MongoDB)   |
|              |  |          |  |             |
+------+-------+  +-----+----+  +-------------+
       |                |
       |                |
       | A2A Protocol   | A2A Protocol
       | (inform)       | (event)
       |                |
       +-------+--------+
               |
        +------v-------+
        |              |
        | NOTIFICADOR  |
        |              |
        +------+-------+
               |
               | AG-UI Protocol
               | (notification)
               |
        +------v-------+
        |              |
        |   UI React   |
        |              |
        +--------------+
```

## Flujo de Creacion y Ejecucion de un Evento

### Fase 1: Creacion del Evento y Generacion del Plan

```
1. Usuario completa formulario en UI
        |
        v
2. UI envia AG-UI request "Plan" --> FastAPI
        |
        v
3. FastAPI invoca Planificador.generate_plan()
        |
        v
4. Planificador usa Gemini 2.0 para generar plan inteligente
        |
        v
5. Planificador envia ACP write --> Base de datos
        |
        v
6. Base de datos persiste plan y retorna ACP response
        |
        v
7. Planificador envia A2A inform --> Notificador
        |
        v
8. Notificador crea notificacion "Plan creado"
        |
        v
9. FastAPI retorna AG-UI response --> UI
        |
        v
10. UI muestra el plan generado con sus tareas
```

### Fase 2: Ejecucion del Plan

```
1. Usuario hace clic en "Ejecutar Plan" en UI
        |
        v
2. UI envia AG-UI request "Ejecutar" --> FastAPI
        |
        v
3. Planificador envia ANP task_assignment --> Ejecutor
        |
        v
4. Ejecutor recibe tareas y envia A2A event --> Notificador
        |
        v
5. Ejecutor procesa cada tarea con Gemini 2.0
        |
        v
6. Para cada tarea completada:
   |
   +-> Ejecutor envia ACP write --> Base de datos
   |
   +-> Ejecutor envia ANP task_result --> Planificador
   |
   +-> Ejecutor envia A2A event --> Notificador
        |
        v
7. Notificador procesa eventos y crea notificaciones
        |
        v
8. FastAPI retorna AG-UI response con resultados --> UI
        |
        v
9. UI muestra resultados de ejecucion
        |
        v
10. Usuario visualiza notificaciones de progreso
```

## Protocolos y Sus Usos

### AG-UI (Agent-UI Protocol)
- **Direccion**: UI <--> FastAPI <--> Agentes
- **Proposito**: Interfaz usuario-sistema
- **Mensajes**: request, response, notification
- **Ejemplo**: Usuario solicita crear plan, sistema notifica exito

### ANP (Agent Negotiation Protocol)
- **Direccion**: Planificador <--> Ejecutor
- **Proposito**: Comunicacion tareas y resultados
- **Mensajes**: task_assignment, task_result, task_query
- **Ejemplo**: Planificador asigna 5 tareas, Ejecutor reporta cada resultado

### A2A (Agent-to-Agent Protocol)
- **Direccion**: Cualquier Agente <--> Cualquier Agente
- **Proposito**: Comunicacion general entre agentes
- **Mensajes**: inform, request, response, event
- **Ejemplo**: Ejecutor notifica evento de ejecucion a Notificador

### ACP (Agent Content Protocol)
- **Direccion**: Cualquier Agente --> Base de datos
- **Proposito**: Acceso exclusivo a persistencia
- **Mensajes**: read, write, update, delete, query
- **Ejemplo**: Planificador guarda plan, Ejecutor consulta historial

## Colecciones de la Base de Datos

```
MongoDB Database: eventos_escolares

Collections:
+------------------+----------------------------------+
| Collection       | Contenido                        |
+------------------+----------------------------------+
| users            | Usuarios (organizadores,         |
|                  | estudiantes, administradores)    |
+------------------+----------------------------------+
| events           | Eventos escolares con detalles   |
|                  | (fecha, asistentes, presupuesto) |
+------------------+----------------------------------+
| plans            | Planes generados por el          |
|                  | Planificador con sus tareas      |
+------------------+----------------------------------+
| tasks            | Tareas individuales de planes    |
+------------------+----------------------------------+
| executions       | Resultados de ejecuciones        |
|                  | realizadas por el Ejecutor       |
+------------------+----------------------------------+
| notifications    | Historial de notificaciones      |
|                  | enviadas a usuarios              |
+------------------+----------------------------------+
| logs             | Logs de todas las acciones       |
|                  | del sistema                      |
+------------------+----------------------------------+
```

## Estructura de un Mensaje de Protocolo

### Ejemplo AG-UI Request
```json
{
  "protocol": "AG-UI",
  "timestamp": "2025-11-12T10:30:00",
  "message_id": "msg-123-abc",
  "sender": "UI",
  "receiver": "Planificador",
  "message_type": "request",
  "action": "Plan",
  "payload": {
    "event_name": "Feria de Ciencias 2025",
    "event_type": "academico",
    "event_date": "2025-12-15",
    "expected_attendees": 200,
    "budget": 5000,
    "description": "Feria anual de ciencias para estudiantes",
    "organizer_email": "organizador@escuela.edu"
  }
}
```

### Ejemplo ANP Task Assignment
```json
{
  "protocol": "ANP",
  "timestamp": "2025-11-12T10:31:00",
  "message_id": "msg-456-def",
  "sender": "Planificador",
  "receiver": "Ejecutor",
  "message_type": "task_assignment",
  "plan_id": "plan-789-ghi",
  "execution_mode": "sequential",
  "tasks": [
    {
      "task_id": "task-1",
      "task_name": "Reservar auditorio",
      "description": "Reservar auditorio para 200 personas",
      "priority": 5,
      "dependencies": [],
      "parameters": {
        "action": "reserve_space",
        "capacity": 200,
        "date": "2025-12-15"
      }
    }
  ]
}
```

### Ejemplo A2A Event
```json
{
  "protocol": "A2A",
  "timestamp": "2025-11-12T10:35:00",
  "message_id": "msg-101-jkl",
  "sender": "Ejecutor",
  "receiver": "Notificador",
  "message_type": "event",
  "event_type": "execution_status",
  "priority": 2,
  "event_data": {
    "execution_id": "exec-202-mno",
    "status": "completed",
    "tasks_completed": 5
  },
  "content": {
    "message": "Ejecucion completada exitosamente",
    "timestamp": "2025-11-12T10:35:00"
  }
}
```

### Ejemplo ACP Write Request
```json
{
  "protocol": "ACP",
  "timestamp": "2025-11-12T10:31:30",
  "message_id": "msg-303-pqr",
  "sender": "Planificador",
  "receiver": "Database",
  "operation": "write",
  "collection": "plans",
  "data": {
    "plan_id": "plan-789-ghi",
    "event_id": "event-404-stu",
    "plan_summary": "Plan completo para Feria de Ciencias",
    "total_tasks": 5,
    "estimated_duration": "3 semanas",
    "status": "created",
    "created_at": "2025-11-12T10:31:30"
  }
}
```

## Ventajas de Esta Arquitectura

1. **Desacoplamiento**: Cada agente puede desarrollarse independientemente
2. **Trazabilidad**: Todos los mensajes tienen timestamp y message_id
3. **Escalabilidad**: Facil agregar nuevos agentes sin modificar existentes
4. **Mantenibilidad**: Protocolos bien definidos facilitan debugging
5. **Seguridad**: ACP controla todo acceso a la base de datos
6. **Inteligencia**: Gemini 2.0 Flash proporciona decisiones contextuales
7. **Resiliencia**: Fallos en un agente no colapsan el sistema
