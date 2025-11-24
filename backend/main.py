from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
import uuid
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import GEMINI_API_KEY, MONGODB_URI
from agents.database_agent import DatabaseAgent
from agents.planning_agent import PlanningAgent
from agents.execution_agent import ExecutionAgent
from agents.notification_agent import NotificationAgent
from protocols.ag_ui import AGUIProtocol


database_agent = None
planning_agent = None
execution_agent = None
notification_agent = None
agui_protocol = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global database_agent, planning_agent, execution_agent, notification_agent, agui_protocol
    database_agent = DatabaseAgent(MONGODB_URI)
    planning_agent = PlanningAgent(GEMINI_API_KEY)
    execution_agent = ExecutionAgent(GEMINI_API_KEY)
    notification_agent = NotificationAgent()
    agui_protocol = AGUIProtocol()
    
    # Conectar database_agent con planning_agent para cargar planes
    planning_agent.set_database_agent(database_agent)
    
    print("INFO:     Todos los agentes inicializados correctamente")
    yield
    database_agent.close()


app = FastAPI(
    title="Sistema Multiagente para Eventos Escolares",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventRequest(BaseModel):
    event_name: str
    event_type: str
    event_date: str
    expected_attendees: int
    budget: float
    description: str
    organizer_email: str


class UserRequest(BaseModel):
    name: str
    email: str
    role: str


class EventAttendanceRequest(BaseModel):
    event_id: str
    user_email: str


class StudentRegistrationRequest(BaseModel):
    student_name: str
    student_email: str
    student_id: str
    event_id: str


@app.get("/")
def root():
    return {
        "message": "Sistema Multiagente para Planificacion de Eventos Escolares",
        "version": "1.0.0",
        "agents": ["UI", "Planificador", "Ejecutor", "Notificador", "Database"],
        "protocols": ["AG-UI", "ANP", "A2A", "ACP"]
    }


@app.post("/api/plan")
def create_plan(event_request: EventRequest):
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Planificador",
            action="Plan",
            payload=event_request.model_dump()
        )
        
        event_id = str(uuid.uuid4())
        event_details = event_request.model_dump()
        event_details["event_id"] = event_id
        event_details["status"] = "planning"
        event_details["available_for_registration"] = False
        event_details["created_at"] = datetime.now().isoformat()
        
        event_acp_msg = database_agent.acp_protocol.create_write_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            data=event_details
        )
        db_response = database_agent.process_acp_message(event_acp_msg.model_dump())
        
        if db_response.status != "success":
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Planificador",
                receiver="UI",
                action="Plan",
                status="error",
                payload={"error": f"Error al guardar evento: {db_response.error_message}"}
            )
            return agui_error.model_dump()
        
        plan = planning_agent.generate_plan(event_details)
        
        planning_agent.save_plan_to_database(database_agent, plan["plan_id"])
        
        notify_msg = planning_agent.notify_progress(
            notification_agent.agent_name,
            plan["plan_id"],
            f"Plan creado exitosamente con {plan['total_tasks']} tareas"
        )
        notification_agent.receive_event(notify_msg)
        
        notification_id = notification_agent.create_custom_notification(
            title="Plan Creado",
            body=f"Se ha creado un plan para el evento '{event_request.event_name}' con {plan['total_tasks']} tareas",
            level="success",
            data={"plan_id": plan["plan_id"], "event_id": event_id}
        )
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Plan",
            status="success",
            payload={
                "plan": plan,
                "event_id": event_id,
                "notification_id": notification_id
            }
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        agui_error = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Plan",
            status="error",
            payload={"error": str(e)}
        )
        return agui_error.model_dump()


@app.post("/api/events/{event_id}/replan")
def regenerate_plan(event_id: str):
    try:
        message_id = str(uuid.uuid4())
        
        # Obtener el evento de la base de datos
        acp_message = database_agent.acp_protocol.create_read_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            query_filter={"event_id": event_id}
        )
        
        event_response = database_agent.process_acp_message(acp_message.model_dump())
        
        if event_response.status != "success" or not event_response.data:
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Planificador",
                receiver="UI",
                action="Plan",
                status="error",
                payload={"error": "Evento no encontrado"}
            )
            return agui_error.model_dump()
        
        event_details = event_response.data
        
        # Generar un nuevo plan
        plan = planning_agent.generate_plan(event_details)
        
        # Guardar el nuevo plan en la base de datos
        planning_agent.save_plan_to_database(database_agent, plan["plan_id"])
        
        # Notificar
        notify_msg = planning_agent.notify_progress(
            notification_agent.agent_name,
            plan["plan_id"],
            f"Nuevo plan generado para el evento '{event_details.get('event_name')}' con {plan['total_tasks']} tareas"
        )
        notification_agent.receive_event(notify_msg)
        
        notification_id = notification_agent.create_custom_notification(
            title="Plan Regenerado",
            body=f"Se ha creado un nuevo plan para el evento '{event_details.get('event_name')}' con {plan['total_tasks']} tareas",
            level="success",
            data={"plan_id": plan["plan_id"], "event_id": event_id}
        )
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Plan",
            status="success",
            payload={
                "plan": plan,
                "event_id": event_id,
                "notification_id": notification_id
            }
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        agui_error = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Plan",
            status="error",
            payload={"error": str(e)}
        )
        return agui_error.model_dump()


@app.post("/api/execute/{plan_id}")
def execute_plan(plan_id: str):
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Ejecutor",
            action="Ejecutar",
            payload={"plan_id": plan_id}
        )
        
        plan = planning_agent.get_plan(plan_id)
        if not plan:
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor",
                receiver="UI",
                action="Ejecutar",
                status="error",
                payload={"error": "Plan no encontrado"}
            )
            return agui_error.model_dump()
        
        anp_message = planning_agent.send_tasks_to_executor(plan_id, execution_agent.agent_name)
        
        execution_response = execution_agent.receive_tasks(anp_message)
        execution_id = execution_response["execution_id"]
        
        notify_msg = execution_agent.notify_status(
            notification_agent.agent_name,
            execution_id,
            "received",
            {"plan_id": plan_id, "tasks_count": len(plan["tasks"])}
        )
        notification_agent.receive_event(notify_msg)
        
        results = execution_agent.execute_tasks(execution_id, database_agent)
        
        # Contar errores y exitos
        error_count = sum(1 for r in results if r.get("status") == "error")
        success_count = len(results) - error_count
        # Contar errores y exitos
        error_count = sum(1 for r in results if r.get("status") == "error")
        success_count = len(results) - error_count
        
        notify_msg = execution_agent.notify_status(
            notification_agent.agent_name,
            execution_id,
            "completed",
            {
                "plan_id": plan_id, 
                "results_count": len(results),
                "success_count": success_count,
                "error_count": error_count
            }
        )
        notification_agent.receive_event(notify_msg)
        
        # Si la ejecución fue exitosa (sin errores), marcar el evento como completado y disponible
        if error_count == 0:
            event_id = plan.get("event_details", {}).get("event_id")
            if event_id:
                # Actualizar el estado del evento a "completed" y "available_for_registration"
                acp_update = database_agent.acp_protocol.create_update_request(
                    message_id=str(uuid.uuid4()),
                    sender="Ejecutor",
                    collection="events",
                    query_filter={"event_id": event_id},
                    update_data={
                        "status": "completed",
                        "available_for_registration": True,
                        "execution_completed_at": datetime.now().isoformat(),
                        "plan_execution_id": execution_id
                    }
                )
                
                update_response = database_agent.process_acp_message(acp_update.model_dump())
                
                if update_response.status == "success":
                    # Crear notificación adicional sobre la disponibilidad para inscripciones
                    notification_agent.create_custom_notification(
                        title="Evento Disponible para Inscripciones",
                        body=f"El evento '{plan.get('event_details', {}).get('event_name')}' está ahora disponible para que los estudiantes se inscriban",
                        level="info",
                        data={"event_id": event_id, "plan_id": plan_id, "execution_id": execution_id}
                    )
        
        notification_id = notification_agent.create_custom_notification(
            title="Ejecucion Completada",
            body=f"Ejecutadas {len(results)} tareas: {success_count} exitosas, {error_count} con errores" + 
                 (" - Evento disponible para inscripciones" if error_count == 0 else ""),
            level="success" if error_count == 0 else "warning",
            data={"plan_id": plan_id, "execution_id": execution_id}
        )
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Ejecutar",
            status="success",
            payload={
                "execution_id": execution_id,
                "results": results,
                "notification_id": notification_id,
                "event_available_for_registration": error_count == 0,
                "summary": {
                    "total": len(results),
                    "success": success_count,
                    "errors": error_count
                }
            }
        )
        
        return agui_response.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        agui_error = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Ejecutar",
            status="error",
            payload={"error": str(e)}
        )
        return agui_error.model_dump()


@app.get("/api/notifications")
def get_notifications():
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Notificador",
            action="Base de datos",
            payload={"query": "get_notifications"}
        )
        
        notifications = notification_agent.send_all_pending_notifications()
        history = notification_agent.get_notification_history()
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Notificador",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={
                "pending": notifications,
                "history": history
            }
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/events/available")
def get_available_events():
    """Obtener eventos disponibles para estudiantes con cupos disponibles"""
    try:
        message_id = str(uuid.uuid4())
        
        # Crear solicitud AG-UI hacia el executor para obtener eventos con cupos
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Ejecutor", 
            action="Base de datos",
            payload={"operation": "get_available_events"}
        )
        
        # Usar protocolo ACP para consultar eventos completados y disponibles para inscripción
        acp_message = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="events",
            query_filter={
                "status": "completed",
                "available_for_registration": True
            },
            sort={"event_date": 1}
        )
        
        events_response = database_agent.process_acp_message(acp_message.model_dump())
        
        if events_response.status != "success":
            raise HTTPException(status_code=500, detail="Error al obtener eventos")
        
        events_with_capacity = []
        for event in events_response.data or []:
            # Consultar registros para este evento
            acp_registrations = database_agent.acp_protocol.create_query_request(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor",
                collection="student_registrations",
                query_filter={"event_id": event.get("event_id")}
            )
            
            registrations_response = database_agent.process_acp_message(acp_registrations.model_dump())
            current_registrations = len(registrations_response.data or [])
            max_capacity = event.get("expected_attendees", 0)
            
            event_with_capacity = {
                **event,
                "current_registrations": current_registrations,
                "available_spots": max(0, max_capacity - current_registrations),
                "is_full": current_registrations >= max_capacity
            }
            events_with_capacity.append(event_with_capacity)
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={"events": events_with_capacity}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/events")
def get_events():
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Database",
            action="Base de datos",
            payload={"collection": "events", "operation": "query"}
        )
        
        acp_message = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            query_filter={},
            sort={"created_at": -1},
            limit=50
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success" if response.status == "success" else "error",
            payload={"events": response.data or []}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/events/{event_id}")
def get_event(event_id: str):
    try:
        acp_message = database_agent.acp_protocol.create_read_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            query_filter={"event_id": event_id}
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        if response.status == "error" or not response.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={"event": response.data}
        )
        
        return agui_response.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users")
def create_user(user_request: UserRequest):
    try:
        user_data = user_request.model_dump()
        user_data["user_id"] = str(uuid.uuid4())
        user_data["created_at"] = datetime.now().isoformat()
        
        acp_message = database_agent.acp_protocol.create_write_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="users",
            data=user_data
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success" if response.status == "success" else "error",
            payload={"user": user_data}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users")
def get_users():
    try:
        acp_message = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="users",
            query_filter={},
            sort={"created_at": -1}
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success" if response.status == "success" else "error",
            payload={"users": response.data or []}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/events/{event_id}/attend")
def register_attendance(event_id: str, attendance: EventAttendanceRequest):
    try:
        acp_message = database_agent.acp_protocol.create_read_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            query_filter={"event_id": event_id}
        )
        
        event_response = database_agent.process_acp_message(acp_message.model_dump())
        
        if not event_response.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        attendance_data = {
            "attendance_id": str(uuid.uuid4()),
            "event_id": event_id,
            "user_email": attendance.user_email,
            "registered_at": datetime.now().isoformat(),
            "status": "confirmed"
        }
        
        acp_write = database_agent.acp_protocol.create_write_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            data=attendance_data
        )
        
        response = database_agent.process_acp_message(acp_write.model_dump())
        
        notification_id = notification_agent.create_custom_notification(
            title="Asistencia Registrada",
            body=f"Usuario {attendance.user_email} registrado para el evento",
            level="success",
            data={"event_id": event_id, "user_email": attendance.user_email}
        )
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={
                "attendance": attendance_data,
                "notification_id": notification_id
            }
        )
        
        return agui_response.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/plans")
def get_plans():
    try:
        plans = planning_agent.list_plans()
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={"plans": plans}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/plans/{plan_id}")
def get_plan_detail(plan_id: str):
    try:
        plan = planning_agent.get_plan(plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Planificador",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={"plan": plan}
        )
        
        return agui_response.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/executions")
def get_executions():
    try:
        executions = execution_agent.list_executions()
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload=executions
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/executions/{execution_id}")
def get_execution_status(execution_id: str):
    try:
        execution = execution_agent.get_execution_status(execution_id)
        
        if "error" in execution:
            raise HTTPException(status_code=404, detail=execution["error"])
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={"execution": execution}
        )
        
        return agui_response.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    """Obtener estadísticas para el dashboard"""
    try:
        # Obtener eventos totales
        acp_all_events = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events"
        )
        all_events_response = database_agent.process_acp_message(acp_all_events.model_dump())
        
        # Obtener eventos disponibles para inscripción
        acp_available_events = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="events",
            query_filter={
                "status": "completed",
                "available_for_registration": True
            }
        )
        available_events_response = database_agent.process_acp_message(acp_available_events.model_dump())
        
        # Obtener total de inscripciones de estudiantes
        acp_registrations = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="UI",
            collection="student_registrations"
        )
        registrations_response = database_agent.process_acp_message(acp_registrations.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Database",
            receiver="UI",
            action="Base de datos",
            status="success",
            payload={
                "stats": {
                    "total_events": len(all_events_response.data or []),
                    "available_events": len(available_events_response.data or []),
                    "total_registrations": len(registrations_response.data or [])
                }
            }
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/students/register")
def register_student_to_event(registration: StudentRegistrationRequest):
    """Registrar estudiante a un evento usando protocolos AG-UI y ACP"""
    try:
        message_id = str(uuid.uuid4())
        
        print(f"DEBUG: Iniciando registro para estudiante: {registration.student_email}")
        
        # Crear solicitud AG-UI hacia el executor
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Ejecutor",
            action="Ejecutar",
            payload={
                "operation": "register_student",
                "student_data": registration.model_dump()
            }
        )
        
        # Verificar que el evento existe y tiene cupos usando ACP
        acp_event_check = database_agent.acp_protocol.create_read_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor", 
            collection="events",
            query_filter={"event_id": registration.event_id}
        )
        
        print(f"DEBUG: Verificando evento: {registration.event_id}")
        event_response = database_agent.process_acp_message(acp_event_check.model_dump())
        
        if event_response.status != "success" or not event_response.data:
            print(f"ERROR: Evento no encontrado: {event_response}")
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor",
                receiver="UI",
                action="Ejecutar",
                status="error",
                payload={"error": "Evento no encontrado"}
            )
            return agui_error.model_dump()
        
        event = event_response.data
        max_capacity = event.get("expected_attendees", 0)
        print(f"DEBUG: Evento encontrado. Capacidad: {max_capacity}")
        
        # Verificar registros actuales usando ACP
        acp_registrations = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="student_registrations", 
            query_filter={"event_id": registration.event_id}
        )
        
        print("DEBUG: Consultando registros existentes...")
        registrations_response = database_agent.process_acp_message(acp_registrations.model_dump())
        current_count = len(registrations_response.data or [])
        print(f"DEBUG: Registros actuales: {current_count}")
        
        if current_count >= max_capacity:
            print(f"ERROR: Evento lleno ({current_count} >= {max_capacity})")
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor",
                receiver="UI", 
                action="Ejecutar",
                status="error",
                payload={"error": "El evento está lleno. No hay cupos disponibles."}
            )
            return agui_error.model_dump()
        
        # Verificar que el estudiante no esté ya registrado
        acp_duplicate_check = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="student_registrations",
            query_filter={
                "event_id": registration.event_id,
                "student_email": registration.student_email
            }
        )
        
        print("DEBUG: Verificando duplicados...")
        duplicate_response = database_agent.process_acp_message(acp_duplicate_check.model_dump())
        
        if duplicate_response.data and len(duplicate_response.data) > 0:
            print(f"ERROR: Estudiante ya registrado")
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor",
                receiver="UI",
                action="Ejecutar", 
                status="error",
                payload={"error": "Ya estás registrado en este evento"}
            )
            return agui_error.model_dump()
        
        # Crear registro usando ACP
        registration_data = {
            "registration_id": str(uuid.uuid4()),
            "event_id": registration.event_id,
            "student_name": registration.student_name,
            "student_email": registration.student_email,
            "student_id": registration.student_id,
            "registered_at": datetime.now().isoformat(),
            "status": "confirmed"
        }
        
        print(f"DEBUG: Creando registro: {registration_data['registration_id']}")
        acp_write = database_agent.acp_protocol.create_write_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="student_registrations",
            data=registration_data
        )
        
        write_response = database_agent.process_acp_message(acp_write.model_dump())
        print(f"DEBUG: Respuesta de escritura: {write_response.status}")
        
        if write_response.status != "success":
            print(f"ERROR: Error al escribir: {write_response}")
            agui_error = agui_protocol.create_response(
                message_id=str(uuid.uuid4()),
                sender="Ejecutor", 
                receiver="UI",
                action="Ejecutar",
                status="error",
                payload={"error": f"Error al registrar estudiante: {write_response.error_message}"}
            )
            return agui_error.model_dump()
        
        # Crear notificación
        notification_id = notification_agent.create_custom_notification(
            title="Registro Exitoso",
            body=f"Estudiante {registration.student_name} registrado exitosamente en el evento '{event.get('event_name')}'",
            level="success",
            data={
                "event_id": registration.event_id,
                "student_email": registration.student_email,
                "registration_id": registration_data["registration_id"]
            }
        )
        
        print("DEBUG: Registro completado exitosamente")
        # Respuesta AG-UI exitosa
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Ejecutar", 
            status="success",
            payload={
                "registration": registration_data,
                "event": event,
                "notification_id": notification_id,
                "remaining_spots": max_capacity - (current_count + 1)
            }
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        print(f"ERROR: Excepción en registro: {str(e)}")
        import traceback
        traceback.print_exc()
        
        agui_error = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Ejecutar",
            status="error",
            payload={"error": f"Error interno: {str(e)}"}
        )
        return agui_error.model_dump()


@app.get("/api/students/{student_email}/registrations")
def get_student_registrations(student_email: str):
    """Obtener registros de un estudiante"""
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI",
            receiver="Ejecutor",
            action="Base de datos",
            payload={"operation": "get_student_registrations", "student_email": student_email}
        )
        
        acp_message = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="student_registrations",
            query_filter={"student_email": student_email},
            sort={"registered_at": -1}
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Base de datos",
            status="success" if response.status == "success" else "error",
            payload={"registrations": response.data or []}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/events/{event_id}/registrations")
def get_event_registrations(event_id: str):
    """Obtener registros de un evento específico"""
    try:
        message_id = str(uuid.uuid4())
        
        agui_request = agui_protocol.create_request(
            message_id=message_id,
            sender="UI", 
            receiver="Ejecutor",
            action="Base de datos",
            payload={"operation": "get_event_registrations", "event_id": event_id}
        )
        
        acp_message = database_agent.acp_protocol.create_query_request(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            collection="student_registrations",
            query_filter={"event_id": event_id},
            sort={"registered_at": -1}
        )
        
        response = database_agent.process_acp_message(acp_message.model_dump())
        
        agui_response = agui_protocol.create_response(
            message_id=str(uuid.uuid4()),
            sender="Ejecutor",
            receiver="UI",
            action="Base de datos",
            status="success" if response.status == "success" else "error", 
            payload={"registrations": response.data or []}
        )
        
        return agui_response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
