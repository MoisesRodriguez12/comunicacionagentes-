from pymongo import MongoClient
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocols.acp import ACPProtocol, ACPResponse


class DatabaseAgent:
    def __init__(self, mongodb_uri: str):
        self.agent_name = "Database"
        self.client = MongoClient(mongodb_uri)
        self.db = self.client.eventos_escolares
        self.acp_protocol = ACPProtocol()
        
        self.collections = {
            "users": self.db.users,
            "events": self.db.events,
            "plans": self.db.plans,
            "tasks": self.db.tasks,
            "executions": self.db.executions,
            "notifications": self.db.notifications,
            "logs": self.db.logs,
            "student_registrations": self.db.student_registrations
        }
        
        self._initialize_collections()
    
    def _initialize_collections(self):
        existing_collections = self.db.list_collection_names()
        
        for collection_name in self.collections.keys():
            if collection_name not in existing_collections:
                self.db.create_collection(collection_name)
        
        if "users" not in existing_collections:
            self.collections["users"].create_index("email", unique=True)
            self.collections["users"].create_index("role")
        
        if "events" not in existing_collections:
            self.collections["events"].create_index("event_id", unique=True)
            self.collections["events"].create_index("created_at")
        
        if "plans" not in existing_collections:
            self.collections["plans"].create_index("plan_id", unique=True)
            self.collections["plans"].create_index("event_id")
        
        if "student_registrations" not in existing_collections:
            self.collections["student_registrations"].create_index("registration_id", unique=True)
            self.collections["student_registrations"].create_index("event_id")
            self.collections["student_registrations"].create_index("student_email")
            self.collections["student_registrations"].create_index([("event_id", 1), ("student_email", 1)], unique=True)
    
    def process_acp_message(self, message: Dict[str, Any]) -> ACPResponse:
        if not self.acp_protocol.validate_message(message):
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message="Invalid ACP message format"
            )
        
        operation = message.get("operation")
        collection_name = message.get("collection")
        
        if collection_name not in self.collections:
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message=f"Collection '{collection_name}' not found"
            )
        
        collection = self.collections[collection_name]
        
        try:
            if operation == "read":
                return self._handle_read(message, collection)
            elif operation == "write":
                return self._handle_write(message, collection)
            elif operation == "update":
                return self._handle_update(message, collection)
            elif operation == "delete":
                return self._handle_delete(message, collection)
            elif operation == "query":
                return self._handle_query(message, collection)
            else:
                return self.acp_protocol.create_response(
                    message_id=str(uuid.uuid4()),
                    request_id=message.get("message_id", ""),
                    receiver=message.get("sender", ""),
                    status="error",
                    error_message=f"Unsupported operation: {operation}"
                )
        except Exception as e:
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message=str(e)
            )
    
    def _handle_read(self, message: Dict[str, Any], collection) -> ACPResponse:
        query_filter = message.get("query_filter", {})
        projection = message.get("projection")
        
        result = collection.find_one(query_filter, projection)
        
        if result and "_id" in result:
            result["_id"] = str(result["_id"])
        
        return self.acp_protocol.create_response(
            message_id=str(uuid.uuid4()),
            request_id=message.get("message_id", ""),
            receiver=message.get("sender", ""),
            status="success",
            data=result,
            rows_affected=1 if result else 0
        )
    
    def _handle_write(self, message: Dict[str, Any], collection) -> ACPResponse:
        data = message.get("data", {})
        
        if not data:
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message="No data provided for write operation"
            )
        
        data["created_at"] = datetime.now().isoformat()
        result = collection.insert_one(data)
        
        return self.acp_protocol.create_response(
            message_id=str(uuid.uuid4()),
            request_id=message.get("message_id", ""),
            receiver=message.get("sender", ""),
            status="success",
            data={"inserted_id": str(result.inserted_id)},
            rows_affected=1
        )
    
    def _handle_update(self, message: Dict[str, Any], collection) -> ACPResponse:
        query_filter = message.get("query_filter", {})
        update_data = message.get("update_data", {})
        
        if not update_data:
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message="No update data provided"
            )
        
        update_data["updated_at"] = datetime.now().isoformat()
        result = collection.update_many(query_filter, {"$set": update_data})
        
        return self.acp_protocol.create_response(
            message_id=str(uuid.uuid4()),
            request_id=message.get("message_id", ""),
            receiver=message.get("sender", ""),
            status="success",
            data={"matched_count": result.matched_count, "modified_count": result.modified_count},
            rows_affected=result.modified_count
        )
    
    def _handle_delete(self, message: Dict[str, Any], collection) -> ACPResponse:
        query_filter = message.get("query_filter", {})
        
        if not query_filter:
            return self.acp_protocol.create_response(
                message_id=str(uuid.uuid4()),
                request_id=message.get("message_id", ""),
                receiver=message.get("sender", ""),
                status="error",
                error_message="No query filter provided for delete operation"
            )
        
        result = collection.delete_many(query_filter)
        
        return self.acp_protocol.create_response(
            message_id=str(uuid.uuid4()),
            request_id=message.get("message_id", ""),
            receiver=message.get("sender", ""),
            status="success",
            data={"deleted_count": result.deleted_count},
            rows_affected=result.deleted_count
        )
    
    def _handle_query(self, message: Dict[str, Any], collection) -> ACPResponse:
        query_filter = message.get("query_filter", {})
        sort = message.get("sort")
        limit = message.get("limit")
        
        cursor = collection.find(query_filter)
        
        if sort:
            cursor = cursor.sort(list(sort.items()))
        
        if limit:
            cursor = cursor.limit(limit)
        
        results = list(cursor)
        
        for result in results:
            if "_id" in result:
                result["_id"] = str(result["_id"])
        
        return self.acp_protocol.create_response(
            message_id=str(uuid.uuid4()),
            request_id=message.get("message_id", ""),
            receiver=message.get("sender", ""),
            status="success",
            data=results,
            rows_affected=len(results)
        )
    
    def log_action(self, agent_name: str, action: str, details: Dict[str, Any]):
        log_entry = {
            "agent": agent_name,
            "action": action,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.collections["logs"].insert_one(log_entry)
    
    def close(self):
        self.client.close()
