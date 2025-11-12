from typing import Dict, Any, List
import uuid
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocols.a2a import A2AProtocol
from protocols.ag_ui import AGUIProtocol
from protocols.acp import ACPProtocol


class NotificationAgent:
    def __init__(self):
        self.agent_name = "Notificador"
        self.a2a_protocol = A2AProtocol()
        self.agui_protocol = AGUIProtocol()
        self.acp_protocol = ACPProtocol()
        self.notification_queue = []
        self.notification_history = []
    
    def receive_event(self, a2a_message: Dict[str, Any]) -> Dict[str, Any]:
        if not self.a2a_protocol.validate_message(a2a_message):
            return {"error": "Invalid A2A message"}
        
        message_type = a2a_message.get("message_type")
        sender = a2a_message.get("sender")
        content = a2a_message.get("content", {})
        
        notification = self._create_notification_from_event(sender, message_type, content, a2a_message)
        
        self.notification_queue.append(notification)
        
        return {
            "notification_id": notification["notification_id"],
            "status": "queued",
            "message": "Notification created and queued for delivery"
        }
    
    def _create_notification_from_event(self, sender: str, message_type: str, content: Dict[str, Any], original_message: Dict[str, Any]) -> Dict[str, Any]:
        notification_id = str(uuid.uuid4())
        
        if sender == "Planificador":
            notification = self._create_planning_notification(notification_id, content, original_message)
        elif sender == "Ejecutor":
            notification = self._create_execution_notification(notification_id, content, original_message)
        else:
            notification = self._create_generic_notification(notification_id, sender, content)
        
        notification["created_at"] = datetime.now().isoformat()
        return notification
    
    def _create_planning_notification(self, notification_id: str, content: Dict[str, Any], original_message: Dict[str, Any]) -> Dict[str, Any]:
        plan_id = content.get("plan_id", "")
        message = content.get("message", "")
        
        if "plan_progress" in original_message.get("information_type", ""):
            level = "info"
            title = "Progreso de Planificacion"
            body = f"Plan {plan_id}: {message}"
        else:
            level = "success"
            title = "Plan Creado"
            body = message
        
        return {
            "notification_id": notification_id,
            "type": "planning",
            "level": level,
            "title": title,
            "body": body,
            "data": content,
            "read": False
        }
    
    def _create_execution_notification(self, notification_id: str, content: Dict[str, Any], original_message: Dict[str, Any]) -> Dict[str, Any]:
        event_type = original_message.get("event_type", "")
        event_data = original_message.get("event_data", {})
        
        status = event_data.get("status", "unknown")
        execution_id = event_data.get("execution_id", "")
        success_count = event_data.get("success_count", 0)
        error_count = event_data.get("error_count", 0)
        results_count = event_data.get("results_count", 0)
        
        level_map = {
            "received": "info",
            "executing": "info",
            "completed": "success" if error_count == 0 else "warning",
            "error": "error",
            "in_progress": "info"
        }
        
        level = level_map.get(status, "info")
        
        title_map = {
            "received": "Tareas Recibidas",
            "executing": "Ejecutando Tareas",
            "completed": "Ejecucion Completada",
            "error": "Error en Ejecucion",
            "in_progress": "Ejecucion en Progreso"
        }
        
        title = title_map.get(status, "Actualizacion de Ejecucion")
        
        if status == "completed" and (success_count > 0 or error_count > 0):
            body = f"Ejecucion finalizada: {success_count} tareas exitosas, {error_count} errores de {results_count} totales"
        else:
            body = content.get("message", f"Estado de ejecucion {execution_id}: {status}")
        
        return {
            "notification_id": notification_id,
            "type": "execution",
            "level": level,
            "title": title,
            "body": body,
            "data": event_data,
            "read": False
        }
    
    def _create_generic_notification(self, notification_id: str, sender: str, content: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "notification_id": notification_id,
            "type": "general",
            "level": "info",
            "title": f"Mensaje de {sender}",
            "body": content.get("message", "Notificacion del sistema"),
            "data": content,
            "read": False
        }
    
    def send_notification_to_ui(self, notification_id: str) -> Dict[str, Any]:
        notification = None
        for notif in self.notification_queue:
            if notif["notification_id"] == notification_id:
                notification = notif
                break
        
        if not notification:
            return {"error": "Notification not found"}
        
        message_id = str(uuid.uuid4())
        
        agui_message = self.agui_protocol.create_notification(
            message_id=message_id,
            sender=self.agent_name,
            receiver="UI",
            action="display_notification",
            notification_level=notification["level"],
            payload={
                "notification_id": notification["notification_id"],
                "type": notification["type"],
                "title": notification["title"],
                "body": notification["body"],
                "data": notification["data"],
                "timestamp": notification["created_at"]
            }
        )
        
        self.notification_queue.remove(notification)
        self.notification_history.append(notification)
        
        return agui_message.model_dump()
    
    def send_all_pending_notifications(self) -> List[Dict[str, Any]]:
        sent_notifications = []
        
        while self.notification_queue:
            notification = self.notification_queue[0]
            agui_message = self.send_notification_to_ui(notification["notification_id"])
            sent_notifications.append(agui_message)
        
        return sent_notifications
    
    def get_pending_notifications(self) -> List[Dict[str, Any]]:
        return self.notification_queue.copy()
    
    def get_notification_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.notification_history[-limit:]
    
    def mark_as_read(self, notification_id: str) -> Dict[str, Any]:
        for notification in self.notification_history:
            if notification["notification_id"] == notification_id:
                notification["read"] = True
                notification["read_at"] = datetime.now().isoformat()
                return {"status": "success", "message": "Notification marked as read"}
        
        return {"error": "Notification not found"}
    
    def save_notification_to_database(self, database_agent: Any, notification_id: str) -> Dict[str, Any]:
        notification = None
        
        for notif in self.notification_history:
            if notif["notification_id"] == notification_id:
                notification = notif
                break
        
        if not notification:
            return {"error": "Notification not found"}
        
        message_id = str(uuid.uuid4())
        acp_message = self.acp_protocol.create_write_request(
            message_id=message_id,
            sender=self.agent_name,
            collection="notifications",
            data=notification
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        return response.model_dump()
    
    def create_custom_notification(self, title: str, body: str, level: str = "info", data: Dict[str, Any] = None) -> str:
        notification_id = str(uuid.uuid4())
        
        notification = {
            "notification_id": notification_id,
            "type": "custom",
            "level": level,
            "title": title,
            "body": body,
            "data": data or {},
            "read": False,
            "created_at": datetime.now().isoformat()
        }
        
        self.notification_queue.append(notification)
        
        return notification_id
