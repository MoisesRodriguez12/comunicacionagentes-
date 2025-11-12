# 🚀 Guía de Inicio Rápido

## Sistema Multi-Agente de Gestión de Eventos Universitarios

---

## ⚡ Inicio Rápido (3 pasos)

### Opción A: Usando Scripts Automáticos (Recomendado)

```powershell
# 1. Instalar dependencias (solo primera vez)
.\install.bat

# 2. Iniciar el sistema completo
.\start.bat
```

### Opción B: Manual

```powershell
# Terminal 1 - Backend API
python backend_api.py

# Terminal 2 - Frontend
cd comunicacionagentes
npm install
npm run dev
```

---

## 🌐 URLs del Sistema

Una vez iniciado:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8081
- **WebSocket**: ws://localhost:8081/ws

---

## 🎯 Funcionalidades Principales

### Para Organizadores 🎯

1. **Crear Eventos**
   - Click en "Dashboard Organizadores"
   - Click en "+ Nuevo Evento"
   - Llenar formulario
   - Click en "Crear y Planificar"
   - ✨ El agente planificador automáticamente descompone el evento en subtareas

2. **Monitorear Comunicación**
   - Ver en tiempo real las comunicaciones AG-UI
   - Seguir el progreso de las tareas
   - Revisar estado de los agentes

3. **Gestionar Registros**
   - Ver registros de estudiantes
   - Revisar feedback recibido
   - Aprobar/rechazar eventos

### Para Estudiantes 👨‍🎓

1. **Explorar Eventos**
   - Click en "Portal Estudiantes"
   - Buscar eventos por nombre o categoría
   - Filtrar por tipo de evento

2. **Registrarse**
   - Click en "Registrarme" en un evento
   - Llenar datos personales
   - Confirmar registro

3. **Dar Feedback**
   - En eventos pasados
   - Calificar con estrellas (1-5)
   - Escribir comentarios

---

## 🤖 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              React + Vite + Tailwind                │
│                                                     │
│  ┌──────────────────┐    ┌───────────────────┐    │
│  │   Organizer      │    │    Student        │    │
│  │   Dashboard      │    │    Portal         │    │
│  └──────────────────┘    └───────────────────┘    │
│                                                     │
│         Agent Service (agentService.js)            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ AG-UI Protocol (WebSocket)
                   │
┌──────────────────▼──────────────────────────────────┐
│                  BACKEND API                        │
│              Python + aiohttp                       │
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │      WebSocket Server                    │     │
│  │  (Maneja protocolos AG-UI y ACP)         │     │
│  └──────────────────┬───────────────────────┘     │
│                     │                              │
│  ┌──────────────────▼───────────────────────┐     │
│  │   Planner Agent (Simula Gemini)         │     │
│  │   - Descompone eventos en subtareas     │     │
│  │   - Gestiona planificación              │     │
│  └──────────────────────────────────────────┘     │
│                                                     │
│  [Preparado para expandir con:]                    │
│  - Executor Agent                                  │
│  - Notifier Agent                                  │
│  - Knowledge Base Agent                            │
└─────────────────────────────────────────────────────┘
```

---

## 📡 Protocolos Implementados

### AG-UI (Agent-GUI)
Comunicación entre interfaz y agentes

**Ejemplo de uso:**
```javascript
// Usuario crea evento → UI envía a Planner
agentService.requestEventPlanning(eventData)
  .then(response => {
    // Recibe subtareas generadas
    console.log(response.tasks);
  });
```

**Mensaje AG-UI:**
```json
{
  "protocol": "ag-ui",
  "from": "agent_ui@localhost",
  "to": "agent_planner@localhost",
  "body": "{eventData}",
  "metadata": {
    "action": "plan-event",
    "type": "event-planning"
  }
}
```

### ACP (Agent Coordination)
Coordinación entre agentes (preparado para expansión)

### ANP (Agent Notification)
Notificaciones y planificación (preparado para expansión)

---

## 📊 Ejemplo de Flujo Completo

### Crear un Evento

1. **Organizador** accede al Dashboard
2. **Organizador** crea evento "Hackathon 2025"
3. **UI Agent** envía mensaje AG-UI al Planner
4. **Planner Agent** procesa y genera 5 subtareas:
   - Reservar espacio
   - Contratar servicios
   - Gestionar presupuesto
   - Coordinar logística
   - Promoción
5. **Planner** envía respuesta AG-UI al UI
6. **UI** muestra subtareas en el Dashboard
7. **Planner** envía actualizaciones de progreso
8. **UI** actualiza en tiempo real

### Registro de Estudiante

1. **Estudiante** ve el evento en Portal
2. **Estudiante** click en "Registrarme"
3. **Estudiante** completa formulario
4. Sistema guarda registro localmente
5. Contador de registros se actualiza
6. Evento aparece en "Mis Eventos"

---

## 🔧 Troubleshooting

### Frontend no se conecta al backend

**Síntoma**: No aparecen mensajes en Monitor de Agentes

**Solución**:
1. Verificar que backend esté corriendo en puerto 8080
2. Ver console del navegador (F12)
3. Sistema funciona sin backend usando localStorage

### Error al instalar dependencias

```powershell
# Limpiar e reinstalar
cd comunicacionagentes
rm -r node_modules
npm install

# Backend
pip install --upgrade pip
pip install aiohttp
```

### Puerto ya en uso

```powershell
# Cambiar puerto del backend
# Editar backend_api.py línea final:
web.run_app(app, host='localhost', port=8081)  # Cambiar puerto

# Actualizar frontend
# Editar agentService.js línea 16:
connect(url = 'ws://localhost:8081')  # Nuevo puerto
```

---

## 📦 Estructura de Archivos

```
multiagentecomunicaciones/
│
├── 📄 README.md              # Documentación principal
├── 📄 QUICK_START.md         # Esta guía
├── 📄 PROTOCOLOS.md          # Documentación técnica protocolos
│
├── 🐍 backend_api.py         # Servidor WebSocket + Agente Planificador
├── 🐍 spade_fixed_patterns.py # Patrones SPADE originales
├── 📋 requirements.txt       # Dependencias Python
│
├── 🚀 install.bat            # Script de instalación
├── 🚀 start.bat              # Script de inicio
│
└── 📁 comunicacionagentes/   # Proyecto React
    ├── 📄 package.json
    ├── 📄 vite.config.js
    └── 📁 src/
        ├── 📄 App.jsx                    # Componente principal
        ├── 📄 main.jsx
        ├── 📄 index.css
        ├── 📁 components/
        │   ├── OrganizerDashboard.jsx   # Dashboard organizadores
        │   └── StudentPortal.jsx        # Portal estudiantes
        └── 📁 services/
            ├── agentService.js          # Comunicación AG-UI
            └── eventService.js          # Gestión eventos
```

---

## 🎓 Conceptos Clave

### Agente
Entidad autónoma que puede:
- Percibir su entorno
- Tomar decisiones
- Comunicarse con otros agentes
- Ejecutar acciones

### Sistema Multi-Agente
Conjunto de agentes que trabajan juntos:
- **UI Agent**: Interfaz con el usuario
- **Planner Agent**: Planificación inteligente
- **Executor Agent**: Ejecución de tareas
- **Notifier Agent**: Notificaciones

### Protocolo de Comunicación
Conjunto de reglas para que los agentes se comuniquen:
- **AG-UI**: UI ↔ Agentes
- **ACP**: Coordinación entre agentes
- **ANP**: Notificaciones

---

## 🔮 Próximas Mejoras

- [ ] Integración con Gemini API real
- [ ] Agente Ejecutor funcional
- [ ] Base de datos persistente
- [ ] Autenticación de usuarios
- [ ] Notificaciones por email
- [ ] Analítica avanzada
- [ ] Integración con calendario

---

## 📞 Ayuda

### Logs

**Frontend**: Abrir DevTools (F12) → Console
**Backend**: Ver terminal donde corre backend_api.py

### Preguntas Frecuentes

**¿Funciona sin internet?**
Sí, todo es local excepto si se integra Gemini API.

**¿Los datos se guardan?**
Sí, en localStorage del navegador.

**¿Puedo agregar más agentes?**
Sí, el sistema está diseñado para expandirse.

**¿Necesito SPADE instalado?**
No, el backend usa solo aiohttp para WebSockets.

---

## ✅ Checklist de Inicio

- [ ] Python 3.8+ instalado
- [ ] Node.js 16+ instalado
- [ ] Ejecutado `install.bat`
- [ ] Ejecutado `start.bat`
- [ ] Frontend abierto en navegador
- [ ] Backend mostrando logs
- [ ] Crear primer evento de prueba
- [ ] Verificar que aparecen subtareas
- [ ] Ver mensajes en Monitor de Agentes

---

**¡Listo para comenzar! 🎉**

Ejecuta `.\start.bat` y accede a http://localhost:5173
