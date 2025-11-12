"""
Backend API con WebSocket para comunicación entre agentes
Implementa protocolos AG-UI y ACP para sistema multi-agente
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional
import logging

try:
    from aiohttp import web
    import aiohttp
except ImportError:
    print("Instalando dependencias necesarias...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'aiohttp'])
    from aiohttp import web
    import aiohttp

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentMessage:
    """Clase para representar mensajes entre agentes"""
    
    def __init__(self, protocol: str, sender: str, receiver: str, body: dict, metadata: dict):
        self.protocol = protocol
        self.sender = sender
        self.receiver = receiver
        self.body = body
        self.metadata = metadata
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self):
        return {
            'protocol': self.protocol,
            'from': self.sender,
            'to': self.receiver,
            'body': json.dumps(self.body) if isinstance(self.body, dict) else self.body,
            'metadata': self.metadata,
            'timestamp': self.timestamp
        }


class PlannerAgent:
    """
    Agente Planificador que descompone eventos en subtareas
    Simula el agente Gemini que recibirá las solicitudes del UI
    """
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.tasks = {}
        logger.info(f"[PLANNER] Inicializado: {agent_id}")
    
    async def process_event_planning(self, event_data: dict, conversation_id: str) -> dict:
        """
        Descompone un evento en subtareas usando protocolo ACP
        """
        logger.info(f"[PLANNER] Procesando planificación de evento: {event_data.get('title', 'Sin título')}")
        
        # Simular procesamiento (aquí iría la integración con Gemini)
        await asyncio.sleep(1)
        
        # Descomponer evento en subtareas
        event_id = event_data.get('id', 'unknown')
        event_title = event_data.get('title', 'Evento')
        
        subtasks = [
            {
                'id': f'{event_id}-task-1',
                'name': 'Reservar espacio',
                'description': f'Reservar {event_data.get("location", "espacio")} para {event_data.get("date", "fecha")}',
                'status': 'pending',
                'priority': 'high',
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-2',
                'name': 'Contratar servicios',
                'description': f'Contratar servicios necesarios (audio, catering, etc.) para {event_title}',
                'status': 'pending',
                'priority': 'medium',
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-3',
                'name': 'Gestionar presupuesto',
                'description': f'Calcular y aprobar presupuesto para evento con capacidad de {event_data.get("capacity", "N/A")} personas',
                'status': 'pending',
                'priority': 'high',
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-4',
                'name': 'Coordinar logística',
                'description': 'Organizar transporte, señalización y personal de apoyo',
                'status': 'pending',
                'priority': 'medium',
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-5',
                'name': 'Promoción del evento',
                'description': 'Crear materiales promocionales y difundir en redes sociales',
                'status': 'pending',
                'priority': 'low',
                'assignedTo': 'agent_executor',
                'completed': False
            }
        ]
        
        # Guardar tareas
        self.tasks[event_id] = {
            'event_id': event_id,
            'event_title': event_title,
            'subtasks': subtasks,
            'conversation_id': conversation_id,
            'status': 'in_progress',
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"[PLANNER] Planificación completada. {len(subtasks)} subtareas creadas")
        
        return {
            'eventId': event_id,
            'tasks': subtasks,
            'status': 'planning_complete',
            'message': f'Evento "{event_title}" descompuesto en {len(subtasks)} subtareas'
        }
    
    async def get_task_status(self, task_id: str) -> dict:
        """Obtener estado de una tarea específica"""
        for event_id, task_data in self.tasks.items():
            for task in task_data['subtasks']:
                if task['id'] == task_id:
                    return task
        return {'error': 'Task not found'}
    
    async def update_task_status(self, task_id: str, status: str) -> bool:
        """Actualizar estado de una tarea"""
        for event_id, task_data in self.tasks.items():
            for task in task_data['subtasks']:
                if task['id'] == task_id:
                    task['status'] = status
                    if status == 'completed':
                        task['completed'] = True
                    logger.info(f"[PLANNER] Tarea {task_id} actualizada a {status}")
                    return True
        return False


class WebSocketServer:
    """
    Servidor WebSocket para comunicación AG-UI entre UI y agentes
    """
    
    def __init__(self):
        self.clients: Dict[str, web.WebSocketResponse] = {}
        self.planner_agent = PlannerAgent('agent_planner@localhost')
        logger.info("[SERVER] WebSocket Server inicializado")
    
    async def websocket_handler(self, request):
        """Manejar conexiones WebSocket"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        client_id = f"client_{datetime.now().timestamp()}"
        self.clients[client_id] = ws
        logger.info(f"[SERVER] Cliente conectado: {client_id}")
        
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    await self.handle_message(client_id, msg.data, ws)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"[SERVER] Error en WebSocket: {ws.exception()}")
        finally:
            del self.clients[client_id]
            logger.info(f"[SERVER] Cliente desconectado: {client_id}")
        
        return ws
    
    async def handle_message(self, client_id: str, message_data: str, ws: web.WebSocketResponse):
        """Procesar mensajes recibidos"""
        try:
            message = json.loads(message_data)
            protocol = message.get('protocol')
            action = message.get('metadata', {}).get('action')
            
            logger.info(f"[SERVER] Mensaje recibido - Protocolo: {protocol}, Acción: {action}")
            
            # Protocolo AG-UI: Comunicación UI -> Agente
            if protocol == 'ag-ui':
                await self.handle_ag_ui_protocol(message, ws)
            
            # Protocolo ACP: Comunicación entre agentes
            elif protocol == 'acp':
                await self.handle_acp_protocol(message, ws)
            
            else:
                logger.warning(f"[SERVER] Protocolo desconocido: {protocol}")
        
        except Exception as e:
            logger.error(f"[SERVER] Error procesando mensaje: {str(e)}")
            error_response = {
                'protocol': 'ag-ui',
                'metadata': {
                    'type': 'error',
                    'message': str(e)
                },
                'body': json.dumps({'error': str(e)})
            }
            await ws.send_json(error_response)
    
    async def handle_ag_ui_protocol(self, message: dict, ws: web.WebSocketResponse):
        """
        Manejar protocolo AG-UI (UI -> Agente)
        """
        action = message.get('metadata', {}).get('action')
        body = message.get('body', '{}')
        conversation_id = message.get('metadata', {}).get('conversation-id')
        
        try:
            event_data = json.loads(body) if isinstance(body, str) else body
        except:
            event_data = {}
        
        # Acción: Planificar evento
        if action == 'plan-event':
            logger.info(f"[AG-UI] Solicitud de planificación recibida")
            
            # Enviar al agente planificador
            planning_result = await self.planner_agent.process_event_planning(
                event_data.get('eventData', event_data),
                conversation_id
            )
            
            # Responder al UI usando protocolo AG-UI
            response = {
                'protocol': 'ag-ui',
                'from': 'agent_planner@localhost',
                'to': message.get('from'),
                'body': json.dumps(planning_result),
                'metadata': {
                    'conversation-id': conversation_id,
                    'type': 'planning-response',
                    'status': 'success',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            await ws.send_json(response)
            logger.info(f"[AG-UI] Respuesta de planificación enviada")
            
            # Simular actualizaciones de progreso
            asyncio.create_task(self.simulate_task_updates(ws, conversation_id, planning_result))
        
        # Acción: Obtener estado de tarea
        elif action == 'get-status':
            task_id = event_data.get('taskId')
            task_status = await self.planner_agent.get_task_status(task_id)
            
            response = {
                'protocol': 'ag-ui',
                'from': 'agent_planner@localhost',
                'to': message.get('from'),
                'body': json.dumps(task_status),
                'metadata': {
                    'conversation-id': conversation_id,
                    'type': 'status-response',
                    'status': 'success',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            await ws.send_json(response)
        
        # Acción: Actualizar información de evento
        elif action == 'update-event':
            logger.info(f"[AG-UI] Actualización de evento recibida")
            
            response = {
                'protocol': 'ag-ui',
                'from': 'agent_planner@localhost',
                'to': message.get('from'),
                'body': json.dumps({'status': 'updated'}),
                'metadata': {
                    'conversation-id': conversation_id,
                    'type': 'update-confirmation',
                    'status': 'success',
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            await ws.send_json(response)
    
    async def handle_acp_protocol(self, message: dict, ws: web.WebSocketResponse):
        """
        Manejar protocolo ACP (Coordinación entre agentes)
        Este protocolo se usará cuando se agreguen más agentes
        """
        logger.info(f"[ACP] Mensaje de coordinación entre agentes")
        # Implementación futura para comunicación entre agentes
        pass
    
    async def simulate_task_updates(self, ws: web.WebSocketResponse, conversation_id: str, planning_result: dict):
        """
        Simular actualizaciones de tareas en progreso
        """
        await asyncio.sleep(3)
        
        tasks = planning_result.get('tasks', [])
        
        for i, task in enumerate(tasks):
            # Simular progreso de cada tarea
            await asyncio.sleep(2)
            
            # Actualizar estado de la tarea
            await self.planner_agent.update_task_status(task['id'], 'in_progress')
            
            # Enviar actualización al UI
            update_message = {
                'protocol': 'ag-ui',
                'from': 'agent_planner@localhost',
                'to': 'agent_ui@localhost',
                'body': f"Tarea en progreso: {task['name']}",
                'metadata': {
                    'conversation-id': f"{conversation_id}-update-{i}",
                    'type': 'task-update',
                    'status': 'in_progress',
                    'task-id': task['id'],
                    'task-name': task['name'],
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            try:
                await ws.send_json(update_message)
                logger.info(f"[AG-UI] Actualización enviada: {task['name']}")
            except:
                logger.warning("[AG-UI] No se pudo enviar actualización (cliente desconectado)")
                break


async def init_app():
    """Inicializar aplicación web"""
    app = web.Application()
    server = WebSocketServer()
    
    # Rutas
    app.router.add_get('/ws', server.websocket_handler)
    
    # Ruta de health check
    async def health_check(request):
        return web.json_response({'status': 'ok', 'message': 'Servidor de agentes operativo'})
    
    app.router.add_get('/health', health_check)
    
    # Servir información del servidor
    async def info(request):
        return web.json_response({
            'name': 'Sistema Multi-Agente - Gestión de Eventos',
            'version': '1.0.0',
            'protocols': ['AG-UI', 'ACP'],
            'agents': ['UI Agent', 'Planner Agent'],
            'websocket_endpoint': '/ws',
            'active_clients': len(server.clients)
        })
    
    app.router.add_get('/', info)
    
    return app


def main():
    """Función principal"""
    logger.info("=== Sistema Multi-Agente de Gestión de Eventos ===")
    logger.info("Iniciando servidor WebSocket...")
    logger.info("Protocolos soportados: AG-UI, ACP")
    logger.info("Agentes activos: UI Agent, Planner Agent")
    logger.info("Puerto: 8081 (cambiado desde 8080 por permisos)")
    
    app = asyncio.run(init_app())
    
    # Iniciar servidor
    try:
        logger.info("🚀 Servidor WebSocket iniciado en ws://localhost:8081")
        web.run_app(
            app,
            host='localhost',
            port=8081
        )
    except KeyboardInterrupt:
        logger.info("\nServidor detenido por el usuario")
    except Exception as e:
        logger.error(f"Error al iniciar servidor: {str(e)}")


if __name__ == '__main__':
    main()
