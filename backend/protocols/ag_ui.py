from typing import Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class AGUIMessage(BaseModel):
    protocol: str = Field(default="AG-UI", description="Protocolo de comunicacion UI-Sistema")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = Field(description="Identificador unico del mensaje")
    sender: str = Field(description="Emisor del mensaje")
    receiver: str = Field(description="Receptor del mensaje")
    message_type: Literal["request", "notification", "response"] = Field(description="Tipo de mensaje")
    action: str = Field(description="Accion a realizar: Plan, Ejecutar, Base de datos")
    payload: Dict[str, Any] = Field(description="Datos del mensaje")


class AGUIRequest(AGUIMessage):
    message_type: Literal["request"] = "request"
    

class AGUINotification(AGUIMessage):
    message_type: Literal["notification"] = "notification"
    notification_level: Literal["info", "warning", "error", "success"] = Field(description="Nivel de notificacion")


class AGUIResponse(AGUIMessage):
    message_type: Literal["response"] = "response"
    status: Literal["success", "error", "pending"] = Field(description="Estado de la respuesta")


class AGUIProtocol:
    def __init__(self):
        self.protocol_name = "AG-UI"
        
    def create_request(self, message_id: str, sender: str, receiver: str, action: str, payload: Dict[str, Any]) -> AGUIRequest:
        return AGUIRequest(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            action=action,
            payload=payload
        )
    
    def create_notification(self, message_id: str, sender: str, receiver: str, action: str, 
                          notification_level: str, payload: Dict[str, Any]) -> AGUINotification:
        return AGUINotification(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            action=action,
            notification_level=notification_level,
            payload=payload
        )
    
    def create_response(self, message_id: str, sender: str, receiver: str, action: str, 
                       status: str, payload: Dict[str, Any]) -> AGUIResponse:
        return AGUIResponse(
            message_id=message_id,
            sender=sender,
            receiver=receiver,
            action=action,
            status=status,
            payload=payload
        )
    
    def validate_message(self, message: Dict[str, Any]) -> bool:
        try:
            if message.get("protocol") != self.protocol_name:
                return False
            required_fields = ["message_id", "sender", "receiver", "message_type", "action", "payload"]
            return all(field in message for field in required_fields)
        except Exception:
            return False
