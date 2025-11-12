from typing import Dict, Any, List
import uuid
import json
import time
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocols.anp import ANPProtocol, ANPTask
from protocols.a2a import A2AProtocol
from protocols.acp import ACPProtocol


class ExecutionAgent:
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        self.agent_name = "Ejecutor"
        self.api_key = api_key
        self.model_name = model_name
        self.llm = None
        
        # Intentar inicializar Gemini, pero no fallar si no se puede
        if api_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=api_key,
                    temperature=0.5
                )
            except Exception as e:
                print(f"Advertencia: No se pudo inicializar Gemini: {e}")
                print("Se usara modo de simulacion")
        
        self.anp_protocol = ANPProtocol()
        self.a2a_protocol = A2AProtocol()
        self.acp_protocol = ACPProtocol()
        self.execution_history = {}
        self.current_executions = {}
    
    def receive_tasks(self, anp_message: Dict[str, Any]) -> Dict[str, Any]:
        if not self.anp_protocol.validate_message(anp_message):
            return {"error": "Invalid ANP message"}
        
        plan_id = anp_message.get("plan_id")
        tasks = anp_message.get("tasks", [])
        execution_mode = anp_message.get("execution_mode", "sequential")
        
        execution_id = str(uuid.uuid4())
        execution_record = {
            "execution_id": execution_id,
            "plan_id": plan_id,
            "tasks": tasks,
            "execution_mode": execution_mode,
            "status": "received",
            "received_at": datetime.now().isoformat(),
            "results": []
        }
        
        self.current_executions[execution_id] = execution_record
        
        return {
            "execution_id": execution_id,
            "status": "received",
            "message": f"Received {len(tasks)} tasks for execution"
        }
    
    def execute_tasks(self, execution_id: str, database_agent: Any = None) -> List[Dict[str, Any]]:
        if execution_id not in self.current_executions:
            return [{"error": "Execution not found"}]
        
        execution = self.current_executions[execution_id]
        tasks = execution["tasks"]
        results = []
        
        execution["status"] = "executing"
        execution["started_at"] = datetime.now().isoformat()
        
        for task in tasks:
            task_obj = ANPTask(**task) if isinstance(task, dict) else task
            result = self._execute_single_task(task_obj)
            results.append(result)
            execution["results"].append(result)
            
            if database_agent:
                self._save_task_result(database_agent, execution["plan_id"], result)
        
        execution["status"] = "completed"
        execution["completed_at"] = datetime.now().isoformat()
        self.execution_history[execution_id] = execution
        
        return results
    
    def _execute_single_task(self, task: ANPTask) -> Dict[str, Any]:
        start_time = time.time()
        
        # Intentar usar Gemini si esta disponible, sino usar fallback
        if self.llm:
            try:
                return self._execute_with_ai(task, start_time)
            except Exception as e:
                print(f"Error con Gemini, usando fallback: {e}")
                # Si Gemini falla, usar fallback
                return self._create_fallback_result(task, time.time() - start_time)
        else:
            # Si no hay Gemini, usar fallback directamente
            return self._create_fallback_result(task, time.time() - start_time)
    
    def _execute_with_ai(self, task: ANPTask, start_time: float) -> Dict[str, Any]:
        """Ejecutar tarea usando Gemini"""
        prompt = f"""Simula la ejecucion de esta tarea para un evento escolar:

Tarea: {task.task_name}
Descripcion: {task.description}
Parametros: {json.dumps(task.parameters, ensure_ascii=False)}

Responde SOLO con un JSON valido (sin texto adicional ni markdown):
{{
  "status": "success",
  "action_taken": "descripcion de lo realizado",
  "details": {{"key": "value"}},
  "observations": "observaciones",
  "next_steps": "siguientes pasos"
}}"""

        try:
            print(f"[DEBUG] Invocando Gemini para tarea: {task.task_name}")
            response = self.llm.invoke(prompt)
            print(f"[DEBUG] Respuesta recibida de Gemini")
            response_text = response.content.strip()
            
            # Limpiar marcadores de codigo
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            print(f"[DEBUG] Parseando JSON de respuesta")
            execution_result = json.loads(response_text)
            execution_time = time.time() - start_time
            
            message_id = str(uuid.uuid4())
            result = self.anp_protocol.create_task_result(
                message_id=message_id,
                sender=self.agent_name,
                receiver="Planificador",
                task_id=task.task_id,
                status=execution_result.get("status", "success"),
                result=execution_result,
                execution_time=execution_time,
                error_message=""
            )
            
            print(f"[DEBUG] Tarea ejecutada exitosamente con Gemini")
            return result.model_dump()
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] Error al parsear JSON de Gemini: {e}")
            print(f"[ERROR] Respuesta recibida: {response_text[:200]}...")
            raise
        except Exception as e:
            print(f"[ERROR] Error al ejecutar con Gemini: {type(e).__name__}: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            raise
    
    def _execute_single_task_with_ai(self, task: ANPTask) -> Dict[str, Any]:
        """Metodo alternativo que usa IA - deshabilitado por problemas con API"""
        start_time = time.time()
        
        prompt = f"""Simula la ejecucion de esta tarea para un evento escolar:

Tarea: {task.task_name}
Descripcion: {task.description}
Parametros: {json.dumps(task.parameters, ensure_ascii=False)}

Responde con un JSON:
{{
  "status": "success",
  "action_taken": "descripcion",
  "details": {{}},
  "observations": "observaciones",
  "next_steps": "siguientes pasos"
}}"""

        try:
            response = self.llm.invoke(prompt)
            response_text = response.content.strip()
            
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            execution_result = json.loads(response_text)
            
            execution_time = time.time() - start_time
            
            message_id = str(uuid.uuid4())
            result = self.anp_protocol.create_task_result(
                message_id=message_id,
                sender=self.agent_name,
                receiver="Planificador",
                task_id=task.task_id,
                status=execution_result.get("status", "success"),
                result=execution_result,
                execution_time=execution_time,
                error_message=""
            )
            
            return result.model_dump()
            
        except json.JSONDecodeError:
            execution_time = time.time() - start_time
            return self._create_fallback_result(task, execution_time)
        except Exception as e:
            execution_time = time.time() - start_time
            return self._create_error_result(task, execution_time, str(e))
    
    def _create_fallback_result(self, task: ANPTask, execution_time: float) -> Dict[str, Any]:
        action = task.parameters.get("action", "generic_action")
        
        simulated_results = {
            "reserve_space": {
                "status": "success",
                "action_taken": f"Espacio reservado para la tarea: {task.task_name}",
                "details": {
                    "space_id": f"SPACE-{uuid.uuid4().hex[:8]}",
                    "capacity": task.parameters.get("capacity", 100),
                    "reservation_confirmed": True
                },
                "observations": "Reservacion confirmada exitosamente",
                "next_steps": "Proceder con la contratacion de servicios"
            },
            "hire_catering": {
                "status": "success",
                "action_taken": f"Servicio de catering contratado para {task.task_name}",
                "details": {
                    "provider": "Catering Escolar Plus",
                    "attendees": task.parameters.get("attendees", 100),
                    "menu": "Menu estandar para eventos",
                    "confirmed": True
                },
                "observations": "Contrato de catering firmado",
                "next_steps": "Coordinar detalles del menu"
            },
            "manage_budget": {
                "status": "success",
                "action_taken": f"Presupuesto gestionado para {task.task_name}",
                "details": {
                    "total_budget": task.parameters.get("budget", 0),
                    "allocated": True,
                    "remaining": task.parameters.get("budget", 0) * 0.15
                },
                "observations": "Presupuesto distribuido correctamente",
                "next_steps": "Monitorear gastos durante la ejecucion"
            },
            "coordinate_logistics": {
                "status": "success",
                "action_taken": f"Logistica coordinada para {task.task_name}",
                "details": {
                    "schedule_created": True,
                    "date": task.parameters.get("date", "Por definir"),
                    "coordinators_assigned": 3
                },
                "observations": "Cronograma establecido",
                "next_steps": "Revisar detalles finales antes del evento"
            }
        }
        
        result = simulated_results.get(action, {
            "status": "success",
            "action_taken": f"Tarea ejecutada: {task.task_name}",
            "details": {"completed": True},
            "observations": "Tarea completada segun parametros",
            "next_steps": "Continuar con siguientes tareas"
        })
        
        message_id = str(uuid.uuid4())
        anp_result = self.anp_protocol.create_task_result(
            message_id=message_id,
            sender=self.agent_name,
            receiver="Planificador",
            task_id=task.task_id,
            status=result["status"],
            result=result,
            execution_time=execution_time,
            error_message=""
        )
        
        return anp_result.model_dump()
    
    def _create_error_result(self, task: ANPTask, execution_time: float, error: str) -> Dict[str, Any]:
        message_id = str(uuid.uuid4())
        result = self.anp_protocol.create_task_result(
            message_id=message_id,
            sender=self.agent_name,
            receiver="Planificador",
            task_id=task.task_id,
            status="error",
            result={
                "status": "error",
                "action_taken": "Intento de ejecucion fallido",
                "details": {},
                "observations": f"Error durante la ejecucion: {error}",
                "next_steps": "Revisar parametros e intentar nuevamente"
            },
            execution_time=execution_time,
            error_message=error
        )
        return result.model_dump()
    
    def _save_task_result(self, database_agent: Any, plan_id: str, result: Dict[str, Any]):
        message_id = str(uuid.uuid4())
        
        execution_record = {
            "plan_id": plan_id,
            "task_id": result.get("task_id"),
            "status": result.get("status"),
            "result": result.get("result"),
            "execution_time": result.get("execution_time"),
            "executed_at": datetime.now().isoformat()
        }
        
        acp_message = self.acp_protocol.create_write_request(
            message_id=message_id,
            sender=self.agent_name,
            collection="executions",
            data=execution_record
        )
        
        database_agent.process_acp_message(acp_message.model_dump())
    
    def notify_status(self, notifier_agent: str, execution_id: str, status: str, details: Dict[str, Any]) -> Dict[str, Any]:
        message_id = str(uuid.uuid4())
        
        a2a_message = self.a2a_protocol.create_event(
            message_id=message_id,
            sender=self.agent_name,
            receiver=notifier_agent,
            event_type="execution_status",
            event_data={
                "execution_id": execution_id,
                "status": status,
                "details": details
            },
            content={
                "message": f"Estado de ejecucion: {status}",
                "timestamp": datetime.now().isoformat()
            },
            priority=2
        )
        
        return a2a_message.model_dump()
    
    def get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        if execution_id in self.current_executions:
            return self.current_executions[execution_id]
        elif execution_id in self.execution_history:
            return self.execution_history[execution_id]
        else:
            return {"error": "Execution not found"}
    
    def list_executions(self) -> Dict[str, List[Dict[str, Any]]]:
        return {
            "current": list(self.current_executions.values()),
            "history": list(self.execution_history.values())
        }
