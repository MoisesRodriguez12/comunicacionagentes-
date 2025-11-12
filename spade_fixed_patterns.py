import spade
from spade.agent import Agent
from spade.behaviour import CyclicBehaviour, OneShotBehaviour
from spade.message import Message
from spade.template import Template
import asyncio
import tkinter as tk
from tkinter import scrolledtext
import time

# Configuración del servidor
import sys
import logging
from spade.agent import Agent

# Configurar logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Patch para corregir el problema de compatibilidad con slixmpp
def patched_async_connect(self):
    """Versión parcheada del método _async_connect que es compatible con slixmpp 1.8.2"""
    async def _connect():
        if not self.client:
            self._connect()
        try:
            # Conectar sin usar argumentos nombrados que no están soportados
            connect_result = self.client.connect()
            if asyncio.iscoroutine(connect_result):
                await connect_result
            # Dar tiempo para establecer la conexión
            await asyncio.sleep(1)
            return True
        except Exception as e:
            logger.error(f"Error al conectar {self.jid}: {str(e)}")
            return False
    return _connect()

# Aplicar el patch a la clase Agent
Agent._async_connect = patched_async_connect

# Configuración del servidor SPADE
SERVER = "localhost"
USERNAME_PREFIX = "agent"
PASSWORD = "test123"

# Configuración de la conexión XMPP
XMPP_SERVER = ("localhost", 5222)

# Clase base para todos los agentes
class BaseAgent(Agent):
    def __init__(self, jid, password):
        super().__init__(jid, password)
        
    async def send(self, msg):
        """Send a message using SPADE's message handling"""
        try:
            print(f"[DEBUG] Enviando mensaje de {self.jid} a {msg.to}")
            print(f"[DEBUG] Contenido: {msg.body[:50] if len(msg.body) > 50 else msg.body}")
            print(f"[DEBUG] Metadata: {msg.metadata}")
            
            # Establecer el remitente si no está configurado
            if not msg.sender:
                msg.sender = str(self.jid)
            
            # Buscar el agente destinatario en el contenedor usando el método correcto
            if hasattr(self, 'container') and self.container:
                to_jid = str(msg.to)
                
                # Usar el método get_agent del contenedor
                try:
                    target_agent = self.container.get_agent(to_jid)
                    if target_agent:
                        print(f"[DEBUG] Entregando mensaje directamente a {to_jid}")
                        # Entregar el mensaje directamente al agente
                        await target_agent.dispatch(msg)
                        print(f"[DEBUG] ✓ Mensaje entregado correctamente")
                        return
                except:
                    pass  # Si no funciona, intentar el fallback
                
                print(f"[WARN] Agente destinatario {to_jid} no encontrado en contenedor")
            
            # Fallback: intentar enviar por XMPP si está disponible
            if hasattr(self, 'client') and self.client:
                try:
                    aioxmpp_msg = msg.prepare(self.client)
                    self.client.send(aioxmpp_msg)
                    print(f"[DEBUG] ✓ Mensaje enviado por XMPP")
                except Exception as xmpp_error:
                    print(f"[WARN] Error al enviar por XMPP: {xmpp_error}")
            
        except Exception as e:
            print(f"[ERROR] Error al enviar mensaje: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

# Agente Coordinador Principal (ACP)
class CoordinatorAgent(BaseAgent):
    def __init__(self, jid, password):
        super().__init__(jid, password)
        self.subtasks = []

    class CoordinateBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                # ACP: Protocolo de coordinación principal
                if msg.get_metadata("protocol") == "acp":
                    print(f"[COORDINATOR] Mensaje recibido de {msg.sender}")
                    print(f"[COORDINATOR] Contenido: {msg.body}")
                    
                    # Si es respuesta de la KB
                    if "Base de Conocimiento" in msg.body:
                        print(f"[COORDINATOR] ✓ KB está operativa")
                        return
                    
                    # Enviar instrucciones de coordinación al planificador
                    response = Message(
                        to=f"{USERNAME_PREFIX}_planner@{SERVER}",
                        body="Nueva tarea para planificar",
                        metadata={
                            "protocol": "acp",
                            "performative": "request",
                            "conversation-id": msg.get_metadata("conversation-id"),
                            "phase": "planning"
                        }
                    )
                    await self.send(response)

    async def setup(self):
        print(f"[LOG] Configurando Coordinador {self.jid}")
        template = Template()
        template.metadata = {"protocol": "acp"}
        self.add_behaviour(self.CoordinateBehaviour(), template)
        print(f"[LOG] ✓ Coordinador configurado exitosamente")

# Agente Notificador-Planificador (ANP)
class PlannerAgent(BaseAgent):
    class PlanningBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                print(f"[PLANNER] ✓ Mensaje recibido de {msg.sender}")
                print(f"[PLANNER] Contenido: {msg.body}")
                print(f"[PLANNER] Metadata: {msg.metadata}")
                
                # ANP: Protocolo específico de notificación y planificación
                if msg.get_metadata("protocol") == "acp" and msg.get_metadata("phase") == "planning":
                    conversation_id = msg.get_metadata("conversation-id")
                    print(f"[PLANNER] Iniciando planificación - ID: {conversation_id}")
                    
                    # Descomponer la tarea en subtareas (protocolo ANP)
                    subtasks = ["subtarea1", "subtarea2", "subtarea3"]
                    
                    # Enviar subtareas al ejecutor usando protocolo ANP
                    for i, subtask in enumerate(subtasks):
                        task_msg = Message(
                            to=f"{USERNAME_PREFIX}_executor@{SERVER}",
                            body=subtask,
                            metadata={
                                "protocol": "anp",
                                "performative": "delegate",
                                "conversation-id": f"{conversation_id}-{i}",
                                "task-type": "subtask",
                                "planning-phase": "execution"
                            }
                        )
                        print(f"[PLANNER] Enviando subtarea {i+1} al ejecutor...")
                        await self.send(task_msg)
                else:
                    print(f"[PLANNER] Mensaje ignorado - no cumple criterios de protocolo")

    async def setup(self):
        print(f"[LOG] Configurando Planificador {self.jid}")
        template = Template()
        template.metadata = {"protocol": "acp"}  # Escucha mensajes del ACP
        self.add_behaviour(self.PlanningBehaviour(), template)
        print(f"[LOG] ✓ Planificador configurado exitosamente")

# Agente a Agente (A2A) - Ejecutor
class ExecutorAgent(BaseAgent):
    class ExecuteBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                # Acepta tareas del ANP (Planificador)
                if msg.get_metadata("protocol") == "anp":
                    conversation_id = msg.get_metadata("conversation-id")
                    print(f"[EXECUTOR] Recibiendo tarea del Planificador - ID: {conversation_id}")
                    print(f"[EXECUTOR] Subtarea: {msg.body}")
                    
                    # Consultar la Base de Conocimiento usando ACP
                    print(f"[EXECUTOR] Consultando recursos a la Base de Conocimiento...")
                    kb_query = Message(
                        to=f"{USERNAME_PREFIX}_kb@{SERVER}",
                        body="recursos_disponibles",
                        metadata={
                            "protocol": "acp",
                            "performative": "query",
                            "conversation-id": f"{conversation_id}-kb",
                            "query-type": "recursos"
                        }
                    )
                    await self.send(kb_query)
                    
                    # Simular trabajo
                    await asyncio.sleep(2)
                    print(f"[EXECUTOR] Tarea completada: {msg.body}")
                    
                    # Enviar notificación al Notificador usando A2A
                    complete_msg = Message(
                        to=f"{USERNAME_PREFIX}_notifier@{SERVER}",
                        body=f"Tarea completada: {msg.body}",
                        metadata={
                            "protocol": "a2a",
                            "performative": "inform",
                            "conversation-id": conversation_id,
                            "status": "completed"
                        }
                    )
                    await self.send(complete_msg)
                    
                # Recibir respuestas de la KB
                elif msg.get_metadata("protocol") == "acp" and msg.get_metadata("performative") == "inform":
                    print(f"[EXECUTOR] Respuesta de KB recibida: {msg.body}")

    async def setup(self):
        print(f"[LOG] Configurando Ejecutor {self.jid}")
        # Escuchar mensajes ANP del Planificador
        template_anp = Template()
        template_anp.metadata = {"protocol": "anp"}
        self.add_behaviour(self.ExecuteBehaviour(), template_anp)
        
        # También escuchar respuestas ACP de la KB
        template_acp = Template()
        template_acp.metadata = {"protocol": "acp"}
        
        class KBResponseBehaviour(CyclicBehaviour):
            async def run(self):
                msg = await self.receive(timeout=10)
                if msg:
                    print(f"[EXECUTOR] Recursos recibidos de KB: {msg.body}")
        
        self.add_behaviour(KBResponseBehaviour(), template_acp)
        print(f"[LOG] ✓ Ejecutor configurado exitosamente")

# Agente Notificador
class NotifierAgent(BaseAgent):
    class NotifyBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                # Recibe mensajes A2A del Ejecutor
                if msg.get_metadata("protocol") == "a2a" and msg.get_metadata("status") == "completed":
                    conversation_id = msg.get_metadata("conversation-id")
                    print(f"[NOTIFIER] Recibido de Ejecutor - ID: {conversation_id}")
                    print(f"[NOTIFIER] Contenido: {msg.body}")
                    
                    # Enviar notificación al UI usando protocolo AG-UI
                    ui_msg = Message(
                        to=f"{USERNAME_PREFIX}_ui@{SERVER}",
                        body=msg.body,
                        metadata={
                            "protocol": "ag-ui",
                            "type": "task-update",
                            "conversation-id": conversation_id,
                            "status": "task-complete"
                        }
                    )
                    print(f"[NOTIFIER] Enviando notificación al UI...")
                    await self.send(ui_msg)

    async def setup(self):
        print(f"[LOG] Configurando Notificador {self.jid}")
        template = Template()
        template.metadata = {"protocol": "a2a"}  # Escucha mensajes A2A del Ejecutor
        self.add_behaviour(self.NotifyBehaviour(), template)
        print(f"[LOG] ✓ Notificador configurado exitosamente")

# Agente con Interfaz de Usuario (AG-UI)
class UIAgent(BaseAgent):
    def __init__(self, jid, password):
        super().__init__(jid, password)
        self.gui = None
        self.root = None

    class UIBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                # AG-UI: Protocolo específico de interfaz de usuario
                if msg.get_metadata("protocol") == "ag-ui":
                    status_type = msg.get_metadata("type")
                    conversation_id = msg.get_metadata("conversation-id")
                    self.agent.update_gui(
                        f"[{status_type}] ID:{conversation_id} - {msg.body}\n"
                    )

    def update_gui(self, message):
        if self.gui:
            self.gui.insert(tk.END, f"{time.strftime('%H:%M:%S')} - {message}")
            self.gui.see(tk.END)

    def setup_gui(self):
        self.root = tk.Tk()
        self.root.title("Sistema Multi-Agente - Monitor de Estados")
        self.gui = scrolledtext.ScrolledText(self.root, width=60, height=20)
        self.gui.pack(padx=10, pady=10)
        self.root.protocol("WM_DELETE_WINDOW", self.stop_agent)

    def stop_agent(self):
        if self.root:
            self.root.destroy()
        # Programar la detención del agente de forma asíncrona
        asyncio.create_task(self.stop())

    async def setup(self):
        print(f"[LOG] Configurando UI {self.jid}")
        template = Template()
        template.metadata = {"protocol": "ag-ui"}  # Solo escucha AG-UI del Notificador
        self.add_behaviour(self.UIBehaviour(), template)
        self.setup_gui()
        asyncio.get_event_loop().create_task(self.update_gui_loop())
        print(f"[LOG] ✓ UI configurado exitosamente")

    async def update_gui_loop(self):
        while self.is_alive():
            self.root.update()
            await asyncio.sleep(0.1)

# Agente Base de Conocimiento (ABC)
class KnowledgeBaseAgent(BaseAgent):
    def __init__(self, jid, password):
        super().__init__(jid, password)
        # Base de conocimiento simple - diccionario con datos
        self.knowledge = {
            "recursos_disponibles": ["servidor_1", "servidor_2", "servidor_3"],
            "configuraciones": {
                "timeout": 30,
                "max_retries": 3,
                "prioridad_default": "media"
            },
            "reglas": [
                "Si tarea es urgente, asignar prioridad alta",
                "Si recursos < 20%, notificar al coordinador",
                "Guardar log de todas las operaciones"
            ],
            "estadisticas": {
                "tareas_completadas": 0,
                "tareas_pendientes": 0,
                "agentes_activos": 0
            }
        }
        
    class QueryBehaviour(CyclicBehaviour):
        async def run(self):
            msg = await self.receive(timeout=10)
            if msg:
                # Protocolo para consultar la base de conocimiento
                if msg.get_metadata("protocol") == "kb-query":
                    query_type = msg.get_metadata("query-type")
                    conversation_id = msg.get_metadata("conversation-id")
                    
                    print(f"[KB] Consulta recibida de {msg.sender}")
                    print(f"[KB] Tipo de consulta: {query_type}")
                    
                    # Procesar diferentes tipos de consultas
                    response_data = None
                    if query_type == "recursos":
                        response_data = self.agent.knowledge.get("recursos_disponibles")
                    elif query_type == "configuracion":
                        config_key = msg.body
                        response_data = self.agent.knowledge.get("configuraciones", {}).get(config_key)
                    elif query_type == "reglas":
                        response_data = self.agent.knowledge.get("reglas")
                    elif query_type == "estadisticas":
                        response_data = self.agent.knowledge.get("estadisticas")
                    elif query_type == "actualizar":
                        # Actualizar estadísticas u otros datos
                        import json
                        try:
                            update_data = json.loads(msg.body)
                            for key, value in update_data.items():
                                if key in self.agent.knowledge:
                                    self.agent.knowledge[key] = value
                            response_data = "Actualización exitosa"
                        except:
                            response_data = "Error en actualización"
                    else:
                        response_data = "Tipo de consulta no reconocido"
                    
                    # Enviar respuesta al solicitante
                    response = Message(
                        to=str(msg.sender),
                        body=str(response_data),
                        metadata={
                            "protocol": "kb-response",
                            "query-type": query_type,
                            "conversation-id": conversation_id,
                            "status": "success"
                        }
                    )
                    await self.send(response)
                    print(f"[KB] Respuesta enviada a {msg.sender}")

    async def setup(self):
        print(f"[LOG] Configurando Base de Conocimiento {self.jid}")
        # Escuchar consultas ACP del Ejecutor
        template_acp = Template()
        template_acp.metadata = {"protocol": "acp"}
        
        # Behaviour para protocolo ACP (consultas del Ejecutor)
        class ACPBehaviour(CyclicBehaviour):
            async def run(self):
                msg = await self.receive(timeout=10)
                if msg:
                    query_type = msg.get_metadata("query-type")
                    conversation_id = msg.get_metadata("conversation-id")
                    print(f"[KB] Consulta ACP recibida de {msg.sender}")
                    print(f"[KB] Tipo: {query_type}, Consulta: {msg.body}")
                    
                    # Procesar consulta
                    response_data = None
                    if query_type == "recursos" or msg.body == "recursos_disponibles":
                        response_data = str(self.agent.knowledge.get("recursos_disponibles"))
                    elif query_type == "configuracion":
                        config_key = msg.body
                        response_data = str(self.agent.knowledge.get("configuraciones", {}).get(config_key))
                    else:
                        response_data = "Consulta no reconocida"
                    
                    # Responder usando ACP
                    response = Message(
                        to=str(msg.sender),
                        body=response_data,
                        metadata={
                            "protocol": "acp",
                            "performative": "inform",
                            "conversation-id": conversation_id,
                            "status": "success"
                        }
                    )
                    print(f"[KB] Enviando respuesta: {response_data}")
                    await self.send(response)
        
        self.add_behaviour(ACPBehaviour(), template_acp)
        print(f"[LOG] ✓ Base de Conocimiento configurada exitosamente")

async def main():
    try:
        print("[LOG] Iniciando sistema multi-agente con SPADE...")
        print("[LOG] Iniciando creación de agentes...")
        # Crear instancias de los agentes
        print("[LOG] Creando agentes con servidor:", SERVER)
        coordinator = CoordinatorAgent(f"{USERNAME_PREFIX}_coordinator@{SERVER}", PASSWORD)
        print(f"[LOG] Coordinador creado: {USERNAME_PREFIX}_coordinator@{SERVER}")
        planner = PlannerAgent(f"{USERNAME_PREFIX}_planner@{SERVER}", PASSWORD)
        print(f"[LOG] Planificador creado: {USERNAME_PREFIX}_planner@{SERVER}")
        executor = ExecutorAgent(f"{USERNAME_PREFIX}_executor@{SERVER}", PASSWORD)
        print(f"[LOG] Ejecutor creado: {USERNAME_PREFIX}_executor@{SERVER}")
        notifier = NotifierAgent(f"{USERNAME_PREFIX}_notifier@{SERVER}", PASSWORD)
        print(f"[LOG] Notificador creado: {USERNAME_PREFIX}_notifier@{SERVER}")
        knowledge_base = KnowledgeBaseAgent(f"{USERNAME_PREFIX}_kb@{SERVER}", PASSWORD)
        print(f"[LOG] Base de Conocimiento creada: {USERNAME_PREFIX}_kb@{SERVER}")
        ui_agent = UIAgent(f"{USERNAME_PREFIX}_ui@{SERVER}", PASSWORD)
        print("[LOG] Agente UI creado")

        print("[LOG] Iniciando agentes...")
        # Iniciar los agentes
        try:
            # Iniciar agentes de forma segura
            agents = [
                ("Coordinador", coordinator),
                ("Planificador", planner),
                ("Ejecutor", executor),
                ("Notificador", notifier),
                ("Base de Conocimiento", knowledge_base),
                ("UI", ui_agent)
            ]
            
            for name, agent in agents:
                try:
                    print(f"[LOG] Iniciando {name}...")
                    await agent.start(auto_register=True)
                    print(f"[LOG] ✓ {name} iniciado - Estado: {agent.is_alive()}")
                    await asyncio.sleep(0.5)  # Pequeña pausa entre inicios
                except Exception as e:
                    print(f"[ERROR] No se pudo iniciar {name}: {str(e)}")
                    raise e
        except Exception as e:
            print(f"[ERROR] Error al iniciar agentes: {str(e)}")
            raise e

        print("[LOG] Sistema multi-agente iniciado correctamente")
    except Exception as e:
        print(f"[ERROR] Error general en main: {str(e)}")
        raise e

    # Iniciar el proceso con una tarea inicial
    try:
        print("\n[LOG] Esperando 3 segundos para que los agentes se estabilicen...")
        await asyncio.sleep(3)
        
        # Verificar que los agentes estén activos
        print(f"[LOG] Estado del coordinador: Activo={coordinator.is_alive()}")
        print(f"[LOG] Estado del planificador: Activo={planner.is_alive()}")
        
        if coordinator.is_alive() and planner.is_alive():
            print("\n[LOG] Creando tarea inicial...")
            planner_jid = f"{USERNAME_PREFIX}_planner@{SERVER}"
            initial_task = Message()
            initial_task.to = planner_jid
            initial_task.body = "Tarea inicial del sistema"
            initial_task.set_metadata("protocol", "acp")
            initial_task.set_metadata("performative", "request")
            initial_task.set_metadata("conversation-id", "task-001")
            initial_task.set_metadata("phase", "planning")
            
            print(f"[LOG] Enviando tarea desde {coordinator.jid} a {planner_jid}...")
            await coordinator.send(initial_task)
            print("[LOG] ✓ Tarea inicial enviada\n")
            
            print("[LOG] Esperando respuestas de los agentes...")
            print("[LOG] (Presiona Ctrl+C para detener el sistema)\n")
        else:
            print("[ERROR] Algún agente no está activo correctamente")
            print(f"  - Coordinador: {coordinator.is_alive()}")
            print(f"  - Planificador: {planner.is_alive()}")
    except Exception as e:
        print(f"[ERROR] Error al enviar tarea inicial: {str(e)}")
        import traceback
        traceback.print_exc()

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n[LOG] Deteniendo el sistema...")
        await coordinator.stop()
        await planner.stop()
        await executor.stop()
        await notifier.stop()
        await knowledge_base.stop()
        await ui_agent.stop()
        print("[LOG] Sistema detenido correctamente")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Deteniendo el sistema...")
    finally:
        print("Sistema detenido")