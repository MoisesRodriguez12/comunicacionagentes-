from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict, Any, List
import uuid
import json
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocols.anp import ANPProtocol, ANPTask
from protocols.a2a import A2AProtocol
from protocols.acp import ACPProtocol


class PlanningAgent:
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self.agent_name = "Planificador"
        self.api_key = api_key
        self.model_name = model_name
        self.llm = None
        
        # Intentar inicializar Gemini, pero no fallar si no se puede
        if api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=api_key,
                    temperature=0.7
                )
            except Exception as e:
                print(f"Advertencia: No se pudo inicializar Gemini: {e}")
                print("Se usara modo de planificacion automatica")
        
        self.anp_protocol = ANPProtocol()
        self.a2a_protocol = A2AProtocol()
        self.acp_protocol = ACPProtocol()
        self.current_plans = {}
    
    def generate_plan(self, event_details: Dict[str, Any]) -> Dict[str, Any]:
        plan_id = str(uuid.uuid4())
        
        # Intentar usar Gemini si esta disponible
        if self.llm:
            try:
                return self._generate_plan_with_ai(plan_id, event_details)
            except Exception as e:
                print(f"Error con Gemini, usando plan automatico: {e}")
                # Si falla, usar fallback
                return self._create_fallback_plan(plan_id, event_details)
        else:
            # Si no hay Gemini, usar fallback directamente
            return self._create_fallback_plan(plan_id, event_details)
    
    def _generate_plan_with_ai(self, plan_id: str, event_details: Dict[str, Any]) -> Dict[str, Any]:
        """Generar plan usando Gemini"""
        prompt = f"""Eres un agente planificador experto en la organizacion de eventos escolares.
        
Debes analizar el siguiente evento y descomponerlo en tareas concretas y ejecutables:

Detalles del evento:
- Nombre: {event_details.get('event_name', 'Sin nombre')}
- Tipo: {event_details.get('event_type', 'Sin tipo')}
- Fecha: {event_details.get('event_date', 'Sin fecha')}
- Numero de asistentes esperados: {event_details.get('expected_attendees', 'No especificado')}
- Presupuesto: {event_details.get('budget', 'No especificado')}
- Descripcion: {event_details.get('description', 'Sin descripcion')}

IMPORTANTE: Debes generar MINIMO 2 tareas y MAXIMO 5 tareas.

Debes generar un plan con tareas especificas para:
1. Reservar espacios adecuados
2. Contratar servicios necesarios (catering, equipo audiovisual, etc.)
3. Gestionar el presupuesto
4. Coordinar la logistica del evento
5. Preparar comunicaciones y notificaciones

Devuelve UNICAMENTE un JSON valido con el siguiente formato (sin texto adicional ni markdown):
{{
  "plan_summary": "Resumen del plan",
  "total_tasks": numero_entre_2_y_5,
  "estimated_duration": "duracion_estimada",
  "tasks": [
    {{
      "task_name": "Nombre de la tarea",
      "description": "Descripcion detallada",
      "priority": numero_del_1_al_5,
      "dependencies": [],
      "parameters": {{
        "action": "accion_especifica",
        "details": "detalles_adicionales"
      }}
    }}
  ]
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
            
            plan_data = json.loads(response_text)
            
            plan = {
                "plan_id": plan_id,
                "event_id": event_details.get("event_id", str(uuid.uuid4())),
                "event_details": event_details,
                "plan_summary": plan_data.get("plan_summary", ""),
                "total_tasks": plan_data.get("total_tasks", 0),
                "estimated_duration": plan_data.get("estimated_duration", ""),
                "tasks": [],
                "status": "created",
                "created_at": datetime.now().isoformat()
            }
            
            tasks = []
            for idx, task_data in enumerate(plan_data.get("tasks", [])):
                task = ANPTask(
                    task_id=f"{plan_id}-task-{idx+1}",
                    task_name=task_data.get("task_name", ""),
                    description=task_data.get("description", ""),
                    priority=task_data.get("priority", 1),
                    dependencies=task_data.get("dependencies", []),
                    parameters=task_data.get("parameters", {})
                )
                tasks.append(task)
            
            plan["tasks"] = [task.model_dump() for task in tasks]
            self.current_plans[plan_id] = plan
            
            return plan
            
        except json.JSONDecodeError as e:
            fallback_plan = self._create_fallback_plan(plan_id, event_details)
            return fallback_plan
        except Exception as e:
            fallback_plan = self._create_fallback_plan(plan_id, event_details)
            return fallback_plan
    
    def _create_fallback_plan(self, plan_id: str, event_details: Dict[str, Any]) -> Dict[str, Any]:
        default_tasks = [
            ANPTask(
                task_id=f"{plan_id}-task-1",
                task_name="Reservar espacio para el evento",
                description=f"Reservar un espacio adecuado para {event_details.get('expected_attendees', 'los asistentes')}",
                priority=5,
                dependencies=[],
                parameters={"action": "reserve_space", "capacity": event_details.get('expected_attendees', 100)}
            ),
            ANPTask(
                task_id=f"{plan_id}-task-2",
                task_name="Contratar servicios de catering",
                description="Contratar servicio de comida y bebida para el evento",
                priority=4,
                dependencies=[f"{plan_id}-task-1"],
                parameters={"action": "hire_catering", "attendees": event_details.get('expected_attendees', 100)}
            ),
            ANPTask(
                task_id=f"{plan_id}-task-3",
                task_name="Gestionar presupuesto",
                description="Distribuir y controlar el presupuesto del evento",
                priority=5,
                dependencies=[],
                parameters={"action": "manage_budget", "budget": event_details.get('budget', 0)}
            ),
            ANPTask(
                task_id=f"{plan_id}-task-4",
                task_name="Coordinar logistica",
                description="Organizar el flujo y cronograma del evento",
                priority=3,
                dependencies=[f"{plan_id}-task-1", f"{plan_id}-task-2"],
                parameters={"action": "coordinate_logistics", "date": event_details.get('event_date', '')}
            )
        ]
        
        plan = {
            "plan_id": plan_id,
            "event_id": event_details.get("event_id", str(uuid.uuid4())),
            "event_details": event_details,
            "plan_summary": f"Plan automatico para {event_details.get('event_name', 'evento')}",
            "total_tasks": len(default_tasks),
            "estimated_duration": "2-3 semanas",
            "tasks": [task.model_dump() for task in default_tasks],
            "status": "created",
            "created_at": datetime.now().isoformat()
        }
        
        self.current_plans[plan_id] = plan
        return plan
    
    def send_tasks_to_executor(self, plan_id: str, executor_agent: str) -> Dict[str, Any]:
        if plan_id not in self.current_plans:
            return {"error": "Plan not found"}
        
        plan = self.current_plans[plan_id]
        tasks = [ANPTask(**task) for task in plan["tasks"]]
        
        message_id = str(uuid.uuid4())
        anp_message = self.anp_protocol.create_task_assignment(
            message_id=message_id,
            sender=self.agent_name,
            receiver=executor_agent,
            plan_id=plan_id,
            tasks=tasks,
            execution_mode="sequential"
        )
        
        plan["status"] = "sent_to_executor"
        plan["sent_at"] = datetime.now().isoformat()
        
        return anp_message.model_dump()
    
    def notify_progress(self, notifier_agent: str, plan_id: str, message: str) -> Dict[str, Any]:
        message_id = str(uuid.uuid4())
        
        a2a_message = self.a2a_protocol.create_inform(
            message_id=message_id,
            sender=self.agent_name,
            receiver=notifier_agent,
            information_type="plan_progress",
            content={
                "plan_id": plan_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            },
            priority=3
        )
        
        return a2a_message.model_dump()
    
    def save_plan_to_database(self, database_agent: Any, plan_id: str) -> Dict[str, Any]:
        if plan_id not in self.current_plans:
            return {"error": "Plan not found"}
        
        plan = self.current_plans[plan_id]
        
        message_id = str(uuid.uuid4())
        acp_message = self.acp_protocol.create_write_request(
            message_id=message_id,
            sender=self.agent_name,
            collection="plans",
            data=plan
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        return response.model_dump()
    
    def query_event_history(self, database_agent: Any, event_type: str) -> List[Dict[str, Any]]:
        message_id = str(uuid.uuid4())
        acp_message = self.acp_protocol.create_query_request(
            message_id=message_id,
            sender=self.agent_name,
            collection="events",
            query_filter={"event_type": event_type},
            limit=10
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        if response.status == "success":
            return response.data or []
        return []
    
    def get_plan(self, plan_id: str) -> Dict[str, Any]:
        return self.current_plans.get(plan_id, {})
    
    def list_plans(self) -> List[Dict[str, Any]]:
        return list(self.current_plans.values())
