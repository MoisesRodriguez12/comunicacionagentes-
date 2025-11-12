# Sistema Multi-Agente de Gestión de Eventos Universitarios

Sistema inteligente para la organización y gestión de eventos universitarios utilizando una arquitectura multi-agente con protocolos de comunicación AG-UI y ACP.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Frontend (React + Vite)**
   - Dashboard para Organizadores
   - Portal para Estudiantes
   - Monitor de comunicación entre agentes en tiempo real

2. **Backend API (Python + WebSocket)**
   - Servidor WebSocket para comunicación en tiempo real
   - Implementación de protocolos AG-UI y ACP
   - Agente Planificador (simulación de Gemini)

3. **Protocolos de Comunicación**
   - **AG-UI**: Comunicación entre UI y Agentes
   - **ACP**: Protocolo de Coordinación Principal entre agentes
   - **ANP**: Notificación y Planificación (preparado para expansión)

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 16+ y npm
- Python 3.8+
- pip

### 1. Configurar el Frontend

```powershell
cd comunicacionagentes
npm install
```

### 2. Configurar el Backend

```powershell
# Instalar dependencias de Python
pip install -r ../requirements.txt
pip install aiohttp
```

## 🎯 Ejecución del Sistema

### Opción 1: Ejecución Completa (Recomendada)

#### Terminal 1 - Backend API:
```powershell
python backend_api.py
```
El servidor WebSocket se iniciará en `ws://localhost:8080`

#### Terminal 2 - Frontend:
```powershell
cd comunicacionagentes
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### Opción 2: Solo Frontend (Sin comunicación con agentes)

```powershell
cd comunicacionagentes
npm run dev
```
La aplicación funcionará con datos locales en localStorage.

## 📋 Funcionalidades

### Dashboard de Organizadores

- ✅ Crear y gestionar eventos
- ✅ Comunicación con Agente Planificador vía protocolo AG-UI
- ✅ Descomposición automática de eventos en subtareas
- ✅ Monitor de comunicación entre agentes en tiempo real
- ✅ Visualización de estadísticas
- ✅ Gestión de registros de estudiantes
- ✅ Visualización de feedback

### Portal de Estudiantes

- ✅ Explorar eventos disponibles
- ✅ Búsqueda y filtrado de eventos
- ✅ Registro a eventos
- ✅ Enviar feedback y calificaciones
- ✅ Interfaz intuitiva y responsive

## 🤖 Flujo de Comunicación con Agentes

### Protocolo AG-UI (UI → Agente Planificador)

1. **Usuario crea un evento** en el Dashboard
2. **UI Agent** envía mensaje con protocolo AG-UI:
   ```json
   {
     "protocol": "ag-ui",
     "from": "agent_ui@localhost",
     "to": "agent_planner@localhost",
     "body": "{...eventData...}",
     "metadata": {
       "performative": "request",
       "conversation-id": "conv-123456",
       "action": "plan-event",
       "type": "event-planning"
     }
   }
   ```

3. **Agente Planificador** procesa y descompone el evento en subtareas:
   - Reservar espacios
   - Contratar servicios
   - Gestionar presupuesto
   - Coordinar logística
   - Promoción del evento

4. **Planificador responde** con protocolo AG-UI:
   ```json
   {
     "protocol": "ag-ui",
     "from": "agent_planner@localhost",
     "to": "agent_ui@localhost",
     "body": "{...tasks...}",
     "metadata": {
       "conversation-id": "conv-123456",
       "type": "planning-response",
       "status": "success"
     }
   }
   ```

5. **UI actualiza** la interfaz mostrando las subtareas generadas

### Protocolo ACP (Comunicación entre Agentes)

Preparado para expansión cuando se agreguen más agentes (Ejecutor, Notificador, Base de Conocimiento).

```
UI Agent → [AG-UI] → Planner Agent → [ACP] → Executor Agent
                                            ↓
                                      [ACP] → Knowledge Base
                                            ↓
                                      [ANP] → Notifier Agent
```

## 📁 Estructura del Proyecto

```
multiagentecomunicaciones/
├── backend_api.py                 # Servidor WebSocket + Agente Planificador
├── spade_fixed_patterns.py        # Patrones SPADE originales
├── requirements.txt               # Dependencias Python
└── comunicacionagentes/
    ├── src/
    │   ├── App.jsx               # Componente principal
    │   ├── main.jsx              # Punto de entrada
    │   ├── index.css             # Estilos globales
    │   ├── components/
    │   │   ├── OrganizerDashboard.jsx   # Dashboard organizadores
    │   │   └── StudentPortal.jsx        # Portal estudiantes
    │   └── services/
    │       ├── agentService.js   # Servicio de comunicación AG-UI
    │       └── eventService.js   # Servicio de gestión de eventos
    ├── package.json
    └── vite.config.js
```

## 🔧 Tecnologías Utilizadas

### Frontend
- React 19
- Vite
- Tailwind CSS
- WebSocket API

### Backend
- Python 3
- aiohttp (WebSocket Server)
- asyncio

### Protocolos
- AG-UI: Agent-GUI Communication
- ACP: Agent Coordination Protocol
- ANP: Agent Notification and Planning

## 🌐 Endpoints del Backend

- `GET /` - Información del servidor
- `GET /health` - Health check
- `WS /ws` - WebSocket para comunicación con agentes

## 📊 Ejemplo de Uso

### 1. Crear un Evento

1. Acceder al Dashboard de Organizadores
2. Clic en "Nuevo Evento"
3. Llenar formulario con detalles del evento
4. Clic en "Crear y Planificar"
5. El sistema automáticamente:
   - Crea el evento localmente
   - Envía solicitud al Agente Planificador vía AG-UI
   - Recibe y muestra las subtareas generadas
   - Actualiza el monitor de agentes con la comunicación

### 2. Registro de Estudiante

1. Cambiar a Portal de Estudiantes
2. Buscar evento de interés
3. Clic en "Registrarme"
4. Completar formulario de registro
5. Confirmación automática

### 3. Enviar Feedback

1. En Portal de Estudiantes
2. Eventos pasados muestran botón "Dejar Feedback"
3. Calificar con estrellas y comentario
4. Feedback visible en Dashboard de Organizadores

## 🔮 Expansión Futura

El sistema está diseñado para agregar fácilmente:

- **Agente Ejecutor**: Ejecutar las subtareas planificadas
- **Agente Notificador**: Enviar notificaciones a estudiantes
- **Base de Conocimiento**: Almacenar y consultar información
- **Integración con Gemini**: API real de Google Gemini para planificación inteligente
- **Autenticación**: Sistema de login para organizadores y estudiantes
- **Base de datos**: PostgreSQL o MongoDB para persistencia

## 🐛 Troubleshooting

### El frontend no se conecta al backend

- Verificar que el backend esté corriendo en `localhost:8080`
- Revisar la consola del navegador para errores de WebSocket
- El sistema funciona sin backend usando localStorage

### Error al instalar dependencias

```powershell
# Frontend
cd comunicacionagentes
rm -rf node_modules
npm install

# Backend
pip install --upgrade pip
pip install -r requirements.txt
pip install aiohttp
```

## 📝 Notas Importantes

- El sistema usa **localStorage** para persistencia local de datos
- La comunicación con agentes es **opcional** - el sistema funciona standalone
- Los protocolos AG-UI y ACP están implementados y listos para expansión
- El Agente Planificador actualmente simula respuestas (preparado para Gemini)

## 👥 Contribución

Este sistema está diseñado para ser extendido. Para agregar nuevos agentes:

1. Implementar la clase del agente en `backend_api.py`
2. Agregar manejo de protocolos en `WebSocketServer`
3. Actualizar `agentService.js` si es necesario
4. Documentar el nuevo protocolo

## 📄 Licencia

Proyecto académico - Universidad

---

**Desarrollado con ❤️ usando arquitectura multi-agente**
