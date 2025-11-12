from typing import Dict, Any, List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ACPMessage(BaseModel):
    protocol: str = Field(default="ACP", description="Protocolo de Acceso a Contenido Persistente")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = Field(description="Identificador unico del mensaje")
    sender: str = Field(description="Agente que solicita acceso a datos")
    receiver: str = Field(default="Database", description="Receptor del mensaje")
    operation: Literal["read", "write", "update", "delete", "query"] = Field(description="Operacion a realizar")
    collection: str = Field(description="Coleccion o tabla objetivo")


class ACPReadRequest(ACPMessage):
    operation: Literal["read"] = "read"
    query_filter: Dict[str, Any] = Field(default_factory=dict, description="Filtros de busqueda")
    projection: Optional[Dict[str, int]] = Field(default=None, description="Campos a retornar")


class ACPWriteRequest(ACPMessage):
    operation: Literal["write"] = "write"
    data: Dict[str, Any] = Field(description="Datos a escribir")


class ACPUpdateRequest(ACPMessage):
    operation: Literal["update"] = "update"
    query_filter: Dict[str, Any] = Field(description="Filtros para encontrar documentos")
    update_data: Dict[str, Any] = Field(description="Datos a actualizar")


class ACPDeleteRequest(ACPMessage):
    operation: Literal["delete"] = "delete"
    query_filter: Dict[str, Any] = Field(description="Filtros para encontrar documentos a eliminar")


class ACPQueryRequest(ACPMessage):
    operation: Literal["query"] = "query"
    query_filter: Dict[str, Any] = Field(default_factory=dict, description="Filtros de busqueda")
    sort: Optional[Dict[str, int]] = Field(default=None, description="Ordenamiento")
    limit: Optional[int] = Field(default=None, description="Limite de resultados")


class ACPResponse(BaseModel):
    protocol: str = Field(default="ACP")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    message_id: str = Field(description="ID del mensaje de respuesta")
    request_id: str = Field(description="ID del mensaje de solicitud original")
    sender: str = Field(default="Database")
    receiver: str = Field(description="Agente que hizo la solicitud")
    status: Literal["success", "error"] = Field(description="Estado de la operacion")
    data: Any = Field(default=None, description="Datos retornados")
    error_message: str = Field(default="", description="Mensaje de error si aplica")
    rows_affected: int = Field(default=0, description="Numero de registros afectados")


class ACPProtocol:
    def __init__(self):
        self.protocol_name = "ACP"
    
    def create_read_request(self, message_id: str, sender: str, collection: str,
                           query_filter: Dict[str, Any] = None, 
                           projection: Dict[str, int] = None) -> ACPReadRequest:
        return ACPReadRequest(
            message_id=message_id,
            sender=sender,
            collection=collection,
            query_filter=query_filter or {},
            projection=projection
        )
    
    def create_write_request(self, message_id: str, sender: str, collection: str,
                            data: Dict[str, Any]) -> ACPWriteRequest:
        return ACPWriteRequest(
            message_id=message_id,
            sender=sender,
            collection=collection,
            data=data
        )
    
    def create_update_request(self, message_id: str, sender: str, collection: str,
                             query_filter: Dict[str, Any], 
                             update_data: Dict[str, Any]) -> ACPUpdateRequest:
        return ACPUpdateRequest(
            message_id=message_id,
            sender=sender,
            collection=collection,
            query_filter=query_filter,
            update_data=update_data
        )
    
    def create_delete_request(self, message_id: str, sender: str, collection: str,
                             query_filter: Dict[str, Any]) -> ACPDeleteRequest:
        return ACPDeleteRequest(
            message_id=message_id,
            sender=sender,
            collection=collection,
            query_filter=query_filter
        )
    
    def create_query_request(self, message_id: str, sender: str, collection: str,
                            query_filter: Dict[str, Any] = None,
                            sort: Dict[str, int] = None,
                            limit: int = None) -> ACPQueryRequest:
        return ACPQueryRequest(
            message_id=message_id,
            sender=sender,
            collection=collection,
            query_filter=query_filter or {},
            sort=sort,
            limit=limit
        )
    
    def create_response(self, message_id: str, request_id: str, receiver: str,
                       status: str, data: Any = None, error_message: str = "",
                       rows_affected: int = 0) -> ACPResponse:
        return ACPResponse(
            message_id=message_id,
            request_id=request_id,
            receiver=receiver,
            status=status,
            data=data,
            error_message=error_message,
            rows_affected=rows_affected
        )
    
    def validate_message(self, message: Dict[str, Any]) -> bool:
        try:
            if message.get("protocol") != self.protocol_name:
                return False
            required_fields = ["message_id", "sender", "operation", "collection"]
            return all(field in message for field in required_fields)
        except Exception:
            return False
