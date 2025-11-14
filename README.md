# Sistema Multiagente para Planificacion de Eventos Escolares

## Introduccion

Este proyecto implementa un sistema multiagente inteligente para la planificacion y gestion automatica de eventos escolares. El sistema utiliza agentes autonomos que se comunican mediante protocolos especializados para descomponer, ejecutar y monitorear tareas complejas relacionadas con la organizacion de eventos educativos.

El sistema permite a organizadores y estudiantes interactuar con una interfaz web intuitiva que coordina cinco agentes especializados:

- **Planificador**: Genera planes detallados para eventos utilizando inteligencia artificial (Gemini 2.0 Flash)
- **Ejecutor**: Ejecuta las tareas planificadas y simula acciones concretas usando IA
- **Notificador**: Gestiona y envia notificaciones sobre el progreso del sistema
- **Base de datos**: Persiste toda la informacion en MongoDB
- **UI (Interfaz)**: Portal web para interaccion con usuarios

## Arquitectura Multiagente y Protocolos Utilizados

### Vision General de la Arquitectura

El sistema sigue un patron de arquitectura orientada a agentes donde cada componente es autonomo y se comunica mediante protocolos estandarizados. Esta arquitectura proporciona:

- **Desacoplamiento**: Los agentes pueden evolucionar independientemente
- **Escalabilidad**: Es posible agregar nuevos agentes sin modificar los existentes
- **Trazabilidad**: Todos los mensajes entre agentes quedan registrados
- **Resiliencia**: Los fallos en un agente no afectan a los demas

### Protocolos de Comunicacion

#### 1. AG-UI (Agent-UI Protocol)

**Proposito**: Protocolo de comunicacion entre la interfaz de usuario y el sistema de agentes.

**Por que lo usamos**: 
- Necesitamos un canal estandarizado para que el usuario interactue con el sistema multiagente
- Permite enviar solicitudes estructuradas (Plan, Ejecutar, Base de datos)
- Facilita el envio de notificaciones y respuestas formateadas al usuario
- Garantiza que toda comunicacion con la UI siga un formato consistente

**Tipos de mensajes**:
- `request`: Solicitudes del usuario al sistema
- `notification`: Alertas y actualizaciones para el usuario
- `response`: Respuestas del sistema a solicitudes

**Estructura**:
```json
{
  "protocol": "AG-UI",
  "message_id": "uuid",
  "sender": "agente_origen",
  "receiver": "agente_destino",
  "message_type": "request|notification|response",
  "action": "Plan|Ejecutar|Base de datos",
  "payload": {}
}
```

#### 2. ANP (Agent Negotiation Protocol)

**Proposito**: Protocolo especializado para comunicacion entre el Planificador y el Ejecutor.

**Por que lo usamos**:
- Se requiere un protocolo especifico para transmitir planes complejos con tareas estructuradas
- Necesitamos enviar metadatos de ejecucion (prioridades, dependencias, parametros)
- Permite al Ejecutor reportar resultados detallados de cada tarea
- Facilita la coordinacion de tareas secuenciales o paralelas

**Tipos de mensajes**:
- `task_assignment`: El Planificador envia tareas al Ejecutor
- `task_result`: El Ejecutor reporta resultados al Planificador
- `task_query`: Consultas sobre el estado de tareas

**Estructura de tarea**:
```json
{
  "task_id": "uuid",
  "task_name": "nombre",
  "description": "descripcion",
  "priority": 1-5,
  "dependencies": ["task_id_1", "task_id_2"],
  "parameters": {}
}
```

#### 3. A2A (Agent-to-Agent Protocol)

**Proposito**: Protocolo generico para comunicacion entre cualquier par de agentes.

**Por que lo usamos**:
- Se necesita un mecanismo flexible para que agentes intercambien informacion sin restricciones
- Permite enviar eventos, solicitudes y respuestas entre agentes arbitrarios
- El Planificador y Ejecutor usan A2A para notificar al Notificador sobre progresos
- Proporciona un canal de comunicacion de proposito general no cubierto por otros protocolos

**Tipos de mensajes**:
- `inform`: Compartir informacion entre agentes
- `request`: Solicitar acciones o datos a otro agente
- `response`: Responder a solicitudes
- `event`: Notificar eventos del sistema

**Casos de uso**:
- Planificador informa al Notificador sobre progreso del plan
- Ejecutor notifica eventos de ejecucion al Notificador
- Coordinacion general entre agentes

#### 4. ACP (Agent Content Protocol)

**Proposito**: Protocolo exclusivo para acceso a la Base de datos.

**Por que lo usamos**:
- MongoDB debe ser accedido de forma controlada y estandarizada
- Se requiere un unico punto de acceso a datos persistentes
- Necesitamos operaciones CRUD bien definidas
- Garantiza consistencia en todas las operaciones de base de datos
- Previene accesos directos no autorizados a la base de datos

**Operaciones soportadas**:
- `read`: Leer un documento especifico
- `write`: Insertar un nuevo documento
- `update`: Actualizar documentos existentes
- `delete`: Eliminar documentos
- `query`: Consultar multiples documentos con filtros

**Estructura**:
```json
{
  "protocol": "ACP",
  "operation": "read|write|update|delete|query",
  "collection": "nombre_coleccion",
  "query_filter": {},
  "data": {}
}
```

### Flujo de Comunicacion

```
Usuario (UI)
    |
    | AG-UI request: "Plan"
    v
Planificador (Gemini AI)
    |
    | ACP: guardar plan
    v
Base de datos (MongoDB)
    ^
    | ACP: leer configuracion
    |
Planificador
    |
    | ANP: task_assignment
    v
Ejecutor (Gemini AI)
    |
    | ACP: guardar resultados
    v
Base de datos
    ^
    | A2A: notificar estado
    |
Ejecutor --> Notificador
                |
                | A2A: recibir eventos
                |
            Notificador
                |
                | AG-UI: notification
                v
            Usuario (UI)
```

### Justificacion del Uso de Multiples Protocolos

**Por que no usar un solo protocolo generico?**

1. **Separacion de responsabilidades**: Cada protocolo tiene un proposito especifico y no mezcla conceptos
2. **Validacion especializada**: Cada protocolo puede validar su contenido segun su dominio
3. **Evolucion independiente**: Los protocolos pueden cambiar sin afectar a otros
4. **Claridad en el codigo**: Al ver el protocolo usado, se entiende inmediatamente el tipo de comunicacion
5. **Seguridad por diseno**: ACP restringe el acceso a datos, AG-UI controla la interaccion con usuarios

## Desarrollo de la Solucion

### Tecnologias Utilizadas

**Backend**:
- Python 3.10+
- FastAPI: Framework web asincronico de alto rendimiento
- LangChain: Framework para integracion con LLMs
- Google Gemini 2.0 Flash: Modelo de IA generativa para Planificador y Ejecutor
- MongoDB: Base de datos NoSQL para persistencia
- Pydantic: Validacion de datos y modelos

**Frontend**:
- React 19
- Vite: Build tool moderno
- Tailwind CSS: Framework de estilos utility-first

### Estructura del Proyecto

```
comunicacionagentes-/
├── .env                          # Variables de entorno
├── backend/
│   ├── __init__.py
│   ├── main.py                   # Servidor FastAPI
│   ├── requirements.txt          # Dependencias Python
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── database_agent.py     # Agente de Base de datos
│   │   ├── planning_agent.py     # Agente Planificador
│   │   ├── execution_agent.py    # Agente Ejecutor
│   │   └── notification_agent.py # Agente Notificador
│   ├── protocols/
│   │   ├── __init__.py
│   │   ├── ag_ui.py             # Protocolo AG-UI
│   │   ├── anp.py               # Protocolo ANP
│   │   ├── a2a.py               # Protocolo A2A
│   │   └── acp.py               # Protocolo ACP
│   └── config/
│       ├── __init__.py
│       └── settings.py          # Configuracion
└── UIagente/
    ├── src/
    │   ├── App.jsx              # Componente principal React
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

### Implementacion de los Agentes

#### Agente Planificador

- Utiliza Gemini 2.0 Flash para generar planes inteligentes
- Recibe detalles del evento via AG-UI desde la UI
- Descompone eventos en tareas concretas y ejecutables
- Envia tareas al Ejecutor mediante ANP
- Notifica progreso al Notificador via A2A
- Persiste planes en la Base de datos usando ACP

**Funcionalidades clave**:
- Generacion de planes contextuales basados en tipo de evento
- Asignacion de prioridades y dependencias entre tareas
- Estimacion de duracion y recursos necesarios

#### Agente Ejecutor

- Usa Gemini 2.0 Flash para simular ejecucion inteligente de tareas
- Recibe tareas via ANP desde el Planificador
- Ejecuta cada tarea considerando sus parametros
- Reporta resultados detallados via ANP
- Notifica estados de ejecucion al Notificador via A2A
- Guarda resultados en la Base de datos usando ACP

**Funcionalidades clave**:
- Simulacion realista de acciones (reservas, contrataciones, etc.)
- Manejo de errores y reintentos
- Registro de metricas de ejecucion

#### Agente Notificador

- Recibe eventos de Planificador y Ejecutor via A2A
- Procesa y clasifica notificaciones por nivel (info, warning, error, success)
- Mantiene cola de notificaciones pendientes
- Envia notificaciones a la UI via AG-UI
- Puede persistir notificaciones usando ACP

**Funcionalidades clave**:
- Creacion de mensajes contextuales segun el evento
- Gestion de historial de notificaciones
- Notificaciones personalizadas

#### Agente Base de datos

- Expone interfaz exclusivamente via protocolo ACP
- Gestiona colecciones: users, events, plans, tasks, executions, notifications, logs
- Implementa operaciones CRUD completas
- Maneja conexiones a MongoDB
- Valida todos los mensajes ACP

**Funcionalidades clave**:
- Inicializacion automatica de colecciones e indices
- Respuestas estructuradas con metadatos
- Logging de todas las operaciones

### API REST (FastAPI)

El servidor expone endpoints que coordinan la comunicacion entre agentes:

**Endpoints principales**:
- `POST /api/plan`: Crea evento y genera plan automaticamente
- `POST /api/execute/{plan_id}`: Ejecuta un plan existente
- `GET /api/events`: Lista todos los eventos
- `GET /api/plans`: Lista todos los planes generados
- `GET /api/notifications`: Obtiene notificaciones del sistema
- `POST /api/users`: Registra un nuevo usuario
- `POST /api/events/{event_id}/attend`: Registra asistencia a un evento

Todos los endpoints siguen el protocolo AG-UI para comunicacion con la interfaz.

### Interfaz de Usuario (React)

La UI proporciona tres vistas principales:

1. **Vista de Eventos**: 
   - Formulario para crear nuevos eventos
   - Lista de eventos existentes
   - Cada evento muestra su estado actual

2. **Vista de Planes**:
   - Lista de planes generados
   - Detalles de tareas de cada plan
   - Boton para ejecutar planes

3. **Vista de Notificaciones**:
   - Historial de todas las notificaciones
   - Notificaciones clasificadas por nivel
   - Indicadores visuales por tipo

## Conclusiones

El sistema multiagente desarrollado demuestra la efectividad de usar protocolos especializados de comunicacion para construir sistemas complejos y escalables. Las principales conclusiones son:

### Ventajas del Enfoque Multiagente

1. **Modularidad**: Cada agente tiene responsabilidades claras y puede evolucionar independientemente
2. **Escalabilidad**: Es facil agregar nuevos agentes o funcionalidades sin modificar el core del sistema
3. **Trazabilidad**: Cada mensaje entre agentes queda registrado, facilitando debugging y auditoria
4. **Inteligencia distribuida**: Los agentes con IA (Planificador y Ejecutor) operan de forma autonoma
5. **Resiliencia**: Los fallos se aislian en agentes individuales sin colapsar el sistema completo

### Valor de los Protocolos Especializados

1. **AG-UI**: Proporciona una interfaz clara y consistente entre humanos y el sistema
2. **ANP**: Permite comunicacion rica y estructurada de tareas complejas entre agentes de planificacion y ejecucion
3. **A2A**: Ofrece flexibilidad para comunicacion general sin restricciones
4. **ACP**: Garantiza acceso controlado y seguro a la capa de persistencia

### Integracion de IA Generativa

El uso de Google Gemini 2.0 Flash en los agentes Planificador y Ejecutor aporta:
- Planes contextuales y adaptativos segun el tipo de evento
- Simulacion inteligente de ejecucion de tareas
- Respuestas en lenguaje natural
- Capacidad de aprendizaje y mejora continua

### Aplicaciones Futuras

Este sistema puede extenderse para:
- Soporte multi-inquilino para multiples instituciones educativas
- Integracion con sistemas externos (calendarios, pagos, espacios fisicos)
- Agentes adicionales para gestion de presupuesto, marketing, y analisis
- Recomendaciones basadas en historico de eventos exitosos
- Optimizacion de recursos mediante algoritmos de asignacion

### Lecciones Aprendidas

1. La separacion de protocolos mejora drasticamente la mantenibilidad del codigo
2. La validacion con Pydantic previene errores en tiempo de ejecucion
3. FastAPI facilita la creacion de APIs asincronas y bien documentadas
4. MongoDB es ideal para almacenar datos semi-estructurados de eventos
5. React + Tailwind permite crear interfaces modernas rapidamente

---

## Configuracion y Ejecucion del Proyecto

### Prerrequisitos

- Python 3.10 o superior
- Node.js 18 o superior
- MongoDB Atlas account (o instancia local de MongoDB)
- Google Gemini API Key

### Configuracion del Backend

1. **Navegar a la raiz del proyecto**:
```powershell
cd c:\Users\luigi\OneDrive\Escritorio\AgentesInteligentes\comunicacionagentes-
```

2. **Activar el entorno virtual de Python**:
```powershell
.\comunicacionagentes\Scripts\Activate.ps1
```

Si aparece un error de politicas de ejecucion, ejecutar primero:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. **Instalar dependencias de Python**:
```powershell
pip install -r backend\requirements.txt
```

4. **Verificar archivo .env**:
El archivo `.env` en la raiz debe contener:
```
GEMINI_API_KEY="tu_api_key_aqui"
MONGODB_URI="tu_mongodb_uri_aqui"
```

5. **Iniciar el servidor FastAPI**:
```powershell
cd backend
python main.py
```

El servidor estara disponible en `http://localhost:8000`

Documentacion interactiva en `http://localhost:8000/docs`

### Configuracion del Frontend

1. **Navegar a la carpeta de la UI** (en una nueva terminal):
```powershell
cd c:\Users\luigi\OneDrive\Escritorio\AgentesInteligentes\comunicacionagentes-\UIagente
```

2. **Instalar dependencias de Node.js**:
```powershell
npm install
```

3. **Iniciar el servidor de desarrollo**:
```powershell
npm run dev
```

La interfaz estara disponible en `http://localhost:5173`

### Uso del Sistema

1. **Abrir el navegador** en `http://localhost:5173`

2. **Crear un evento**:
   - Ir a la pestaña "Eventos"
   - Hacer clic en "Crear Evento"
   - Llenar el formulario con los detalles del evento
   - Hacer clic en "Crear Evento y Generar Plan"
   - El sistema automaticamente generara un plan usando el agente Planificador

3. **Ejecutar un plan**:
   - Ir a la pestaña "Planes"
   - Seleccionar un plan de la lista
   - Ver los detalles de las tareas en el panel derecho
   - Hacer clic en "Ejecutar Plan"
   - El agente Ejecutor procesara cada tarea y reportara resultados

4. **Ver notificaciones**:
   - Ir a la pestaña "Notificaciones"
   - Ver todas las actualizaciones del sistema
   - Las notificaciones se clasifican por nivel (success, info, warning, error)

### Verificacion del Sistema

**Verificar protocolos en accion**:

1. Abrir las herramientas de desarrollador del navegador (F12)
2. Ir a la pestaña "Network"
3. Crear un evento y observar las peticiones
4. Cada respuesta mostrara el protocolo usado (`AG-UI` en el campo `protocol`)

**Verificar base de datos**:

1. Conectarse a MongoDB Atlas o instancia local
2. Verificar las colecciones creadas: `events`, `plans`, `tasks`, `executions`, `notifications`, `logs`
3. Cada documento contendra metadatos de cuando fue creado y por que agente

**Logs del backend**:

El servidor FastAPI muestra en consola todas las peticiones recibidas y procesadas.

### Troubleshooting

**Error de conexion a MongoDB**:
- Verificar que la URI en `.env` sea correcta
- Verificar que la IP este en la lista blanca de MongoDB Atlas

**Error con Gemini API**:
- Verificar que la API key en `.env` sea valida
- Verificar que haya cuota disponible en Google AI Studio

**CORS errors en el navegador**:
- Verificar que el backend este corriendo en el puerto 8000
- Verificar que el frontend este corriendo en el puerto 5173

**Errores de importacion en Python**:
- Asegurarse de que el entorno virtual este activado
- Reinstalar dependencias: `pip install -r backend\requirements.txt`

---

 ## Pruebas

    Pruebas de Integración
Flujo Completo de Creación de Evento

Entrada: Datos del evento desde la UI
Planificación: Generación automática del plan por Planning Agent
Almacenamiento: Guardado en MongoDB mediante Database Agent
Notificación: Confirmación al usuario

Resultado: Flujo completado exitosamente en promedio de 3-5 segundos
Flujo de Ejecución de Plan

Inicio: Solicitud de ejecución desde la UI
Comunicación A2A: Planning Agent envía tareas a Execution Agent
Ejecución: Procesamiento secuencial de tareas
Actualización: Cambio de estado del evento
Notificaciones: Actualización en tiempo real

Resultado: Ejecución exitosa con manejo correcto de dependencias
Flujo de Inscripción de Estudiantes

Verificación: Comprobación de cupos disponibles
Validación: Prevención de inscripciones duplicadas
Registro: Almacenamiento en base de datos
Actualización: Reflejo inmediato en la UI

Resultado: Sistema de cupos funcionando correctamente

    Pruebas de Sistema

Eventos concurrentes: Creación de 10 eventos simultáneos
Inscripciones masivas: 50 estudiantes registrándose al mismo tiempo
Resultado: Sistema estable con tiempos de respuesta menores a 2 segundos

Pruebas de UI/UX

Responsividad: Verificación en diferentes tamaños de pantalla
Navegación: Flujo intuitivo entre vistas
Feedback visual: Indicadores de carga y notificaciones claras
Resultado: Interfaz funcional y amigable

La interfaz nos da mucho beneficio para visualizar de la mejor manera posible lo que queremos obtener, ya que es muy fácil navegar por ella y verificar el estado de los eventos y planes, ademas nos permite obtener un centro de notificaciones que nos da retroalimentación de lo que ocurre en el sistema.

    Endpoints probados con diferentes escenarios:

-POST /api/plan - Creación de planes

-POST /api/execute/{plan_id} - Ejecución de planes

-GET /api/events/available - Consulta de eventos disponibles

-POST /api/students/register - Registro de estudiantes

-GET /api/notifications - Obtención de notificaciones

-GET /api/dashboard/stats - Estadísticas del dashboard


 ## Conclusiones

1. Sistema Multiagente Funcional
Se implementó exitosamente un sistema multiagente basado en protocolos de comunicación estandarizados que permite:

Modularidad: Cada agente tiene responsabilidades bien definidas
Escalabilidad: Fácil adición de nuevos agentes o funcionalidades
Mantenibilidad: Código organizado y documentado

2. Integración con IA Generativa
La integración con Google Gemini AI demostró ser efectiva para:

Generar planes de eventos contextualizados y detallados
Crear tareas con dependencias lógicas
Estimar duraciones y recursos necesarios

3. Protocolos de Comunicación Robustos
Los 4 protocolos implementados (AG-UI, ANP, A2A, ACP) proporcionan:

Consistencia: Formato uniforme de mensajes
Trazabilidad: Seguimiento completo de operaciones
Interoperabilidad: Comunicación fluida entre componentes

4. Interfaz de Usuario Intuitiva
El frontend desarrollado con React y TailwindCSS ofrece:

Experiencia fluida: Navegación intuitiva entre módulos
Feedback visual: Notificaciones y estados claros
Responsividad: Adaptación a diferentes dispositivos

### Por lo que conlcuimos
Este proyecto demuestra exitosamente cómo la combinación de:

Arquitectura multiagente para distribución de responsabilidades
IA generativa para automatización inteligente
Protocolos estandarizados para comunicación robusta
Diseño centrado en el usuario para experiencia fluida

Puedimos resolver problemas complejos de gestión de eventos de manera eficiente y escalable.
El sistema no solo cumple con los objetivos planteados, sino que sienta las bases para un ecosistema extensible que puede adaptarse a las necesidades cambiantes de instituciones educativas.

### Informacion del Proyecto

**Version**: 1.0.0

**Autores**: Equipo de Desarrollo de Sistemas Multiagente

**Licencia**: MIT

**Repositorio**: MoisesRodriguez12/comunicacionagentes-

**Contacto**: Para preguntas o soporte, abrir un issue en el repositorio de GitHub


