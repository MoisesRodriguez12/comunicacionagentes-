from typing import Dict, Any, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class ANPTask(BaseModel):
    task_id: str = Field(description="Identificador unico de la tarea")
    task_name: str = Field(description="Nombre de la tarea")
    description: str = Field(description="Descripcion de la tarea")
    priority: int = Field(default=1, ge=1, le=5, description="Prioridad de la tarea")
    dependencies: List[str] = Field(default_factory=list, description="IDs de tareas dependientes")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parametros de ejecucion")


class ANPMessage(BaseModel):
    protocol: str = Field(default="ANP", description="Protocolo Agente-Negociacion-Planificacion")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = Field(description="Identificador unico del mensaje")
    sender: str = Field(description="Emisor del mensaje")
    receiver: str = Field(description="Receptor del mensaje")
    message_type: Literal["task_assignment", "task_result", "task_query"] = Field(description="Tipo de mensaje")


class ANPTaskAssignment(ANPMessage):
    message_type: Literal["task_assignment"] = "task_assignment"
    plan_id: str = Field(description="Identificador del plan")
    tasks: List[ANPTask] = Field(description="Lista de tareas a ejecutar")
    execution_mode: Literal["sequential", "parallel"] = Field(default="sequential")


class ANPTaskResult(ANPMessage):
    message_type: Literal["task_result"] = "task_result"
    task_id: str = Field(description="Identificador de la tarea ejecutada")
    status: Literal["success", "error", "in_progress"] = Field(description="Estado de la tarea")
    result: Dict[str, Any] = Field(description="Resultado de la ejecucion")
    execution_time: float = Field(description="Tiempo de ejecucion en segundos")
    error_message: str = Field(default="", description="Mensaje de error si aplica")


class ANPTaskQuery(ANPMessage):
    message_type: Literal["task_query"] = "task_query"
    task_id: str = Field(description="Identificador de la tarea a consultar")


class ANPProtocol:
    def __init__(self):
        self.protocol_name = "ANP"
    
    def create_task_assignment(self, message_id: str, sender: str, receiver: str, 
                              plan_id: str, tasks: List[ANPTask], 
                              execution_mode: str = "sequential") -> ANPTaskAssignment:
        return ANPTaskAssignment(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            plan_id=plan_id,
            tasks=tasks,
            execution_mode=execution_mode
        )
    
    def create_task_result(self, message_id: str, sender: str, receiver: str,
                          task_id: str, status: str, result: Dict[str, Any],
                          execution_time: float, error_message: str = "") -> ANPTaskResult:
        return ANPTaskResult(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            task_id=task_id,
            status=status,
            result=result,
            execution_time=execution_time,
            error_message=error_message
        )
    
    def create_task_query(self, message_id: str, sender: str, receiver: str, 
                         task_id: str) -> ANPTaskQuery:
        return ANPTaskQuery(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            task_id=task_id
        )
    
    def validate_message(self, message: Dict[str, Any]) -> bool:
        try:
            if message.get("protocol") != self.protocol_name:
                return False
            required_fields = ["message_id", "sender", "receiver", "message_type"]
            return all(field in message for field in required_fields)
        except Exception:
            return False
