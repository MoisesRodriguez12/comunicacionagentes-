from typing import Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class A2AMessage(BaseModel):
    protocol: str = Field(default="A2A", description="Protocolo de comunicacion Agente-a-Agente")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = Field(description="Identificador unico del mensaje")
    sender: str = Field(description="Agente emisor del mensaje")
    receiver: str = Field(description="Agente receptor del mensaje")
    message_type: Literal["inform", "request", "response", "event"] = Field(description="Tipo de mensaje")
    content: Dict[str, Any] = Field(description="Contenido del mensaje")
    priority: int = Field(default=1, ge=1, le=5, description="Prioridad del mensaje")


class A2AInform(A2AMessage):
    message_type: Literal["inform"] = "inform"
    information_type: str = Field(description="Tipo de informacion compartida")


class A2ARequest(A2AMessage):
    message_type: Literal["request"] = "request"
    request_type: str = Field(description="Tipo de solicitud")
    requires_response: bool = Field(default=True)


class A2AResponse(A2AMessage):
    message_type: Literal["response"] = "response"
    request_id: str = Field(description="ID del mensaje de solicitud original")
    status: Literal["success", "error", "partial"] = Field(description="Estado de la respuesta")


class A2AEvent(A2AMessage):
    message_type: Literal["event"] = "event"
    event_type: str = Field(description="Tipo de evento")
    event_data: Dict[str, Any] = Field(description="Datos del evento")


class A2AProtocol:
    def __init__(self):
        self.protocol_name = "A2A"
    
    def create_inform(self, message_id: str, sender: str, receiver: str,
                     information_type: str, content: Dict[str, Any], 
                     priority: int = 1) -> A2AInform:
        return A2AInform(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            information_type=information_type,
            content=content,
            priority=priority
        )
    
    def create_request(self, message_id: str, sender: str, receiver: str,
                      request_type: str, content: Dict[str, Any],
                      requires_response: bool = True, priority: int = 1) -> A2ARequest:
        return A2ARequest(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            request_type=request_type,
            content=content,
            requires_response=requires_response,
            priority=priority
        )
    
    def create_response(self, message_id: str, sender: str, receiver: str,
                       request_id: str, status: str, content: Dict[str, Any],
                       priority: int = 1) -> A2AResponse:
        return A2AResponse(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            request_id=request_id,
            status=status,
            content=content,
            priority=priority
        )
    
    def create_event(self, message_id: str, sender: str, receiver: str,
                    event_type: str, event_data: Dict[str, Any],
                    content: Dict[str, Any], priority: int = 1) -> A2AEvent:
        return A2AEvent(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            event_type=event_type,
            event_data=event_data,
            content=content,
            priority=priority
        )
    
    def validate_message(self, message: Dict[str, Any]) -> bool:
        try:
            if message.get("protocol") != self.protocol_name:
                return False
            required_fields = ["message_id", "sender", "receiver", "message_type", "content"]
            return all(field in message for field in required_fields)
        except Exception:
            return False
