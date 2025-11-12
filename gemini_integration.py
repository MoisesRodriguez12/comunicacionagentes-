"""
Ejemplo de integración con Google Gemini API para el Agente Planificador
Este archivo muestra cómo reemplazar la simulación con una integración real
"""

import os
import json
from typing import Dict, List
import logging

# Descomentar para usar Gemini real
# import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiPlannerAgent:
    """
    Agente Planificador mejorado con Google Gemini
    
    Uso:
    1. Instalar: pip install google-generativeai
    2. Obtener API key de: https://makersuite.google.com/app/apikey
    3. Configurar variable de entorno: GEMINI_API_KEY
    4. Reemplazar PlannerAgent en backend_api.py
    """
    
    def __init__(self, agent_id: str, api_key: str = None):
        self.agent_id = agent_id
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.tasks = {}
        
        # Configurar Gemini
        if self.api_key:
            try:
                # genai.configure(api_key=self.api_key)
                # self.model = genai.GenerativeModel('gemini-pro')
                logger.info(f"[PLANNER-GEMINI] Inicializado: {agent_id}")
            except Exception as e:
                logger.error(f"[PLANNER-GEMINI] Error al configurar Gemini: {e}")
                self.model = None
        else:
            logger.warning("[PLANNER-GEMINI] API key no encontrada, usando modo simulación")
            self.model = None
    
    async def process_event_planning(self, event_data: dict, conversation_id: str) -> dict:
        """
        Descompone un evento en subtareas usando Gemini AI
        """
        event_id = event_data.get('id', 'unknown')
        event_title = event_data.get('title', 'Evento')
        
        logger.info(f"[PLANNER-GEMINI] Procesando: {event_title}")
        
        # Si Gemini está disponible, usar IA real
        if self.model:
            subtasks = await self._generate_tasks_with_gemini(event_data)
        else:
            # Fallback a simulación
            subtasks = self._generate_tasks_simulation(event_data)
        
        # Guardar tareas
        self.tasks[event_id] = {
            'event_id': event_id,
            'event_title': event_title,
            'subtasks': subtasks,
            'conversation_id': conversation_id,
            'status': 'in_progress',
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"[PLANNER-GEMINI] {len(subtasks)} subtareas creadas")
        
        return {
            'eventId': event_id,
            'tasks': subtasks,
            'status': 'planning_complete',
            'message': f'Evento "{event_title}" planificado con {len(subtasks)} subtareas'
        }
    
    async def _generate_tasks_with_gemini(self, event_data: dict) -> List[dict]:
        """
        Generar subtareas usando Gemini AI
        """
        # Crear prompt estructurado para Gemini
        prompt = self._create_planning_prompt(event_data)
        
        try:
            # Llamar a Gemini
            response = self.model.generate_content(prompt)
            
            # Parsear respuesta
            tasks_text = response.text
            subtasks = self._parse_gemini_response(tasks_text, event_data['id'])
            
            logger.info(f"[PLANNER-GEMINI] Tareas generadas por IA: {len(subtasks)}")
            return subtasks
            
        except Exception as e:
            logger.error(f"[PLANNER-GEMINI] Error con Gemini: {e}")
            # Fallback a simulación
            return self._generate_tasks_simulation(event_data)
    
    def _create_planning_prompt(self, event_data: dict) -> str:
        """
        Crear prompt optimizado para Gemini
        """
        prompt = f"""
Eres un experto planificador de eventos universitarios. Descompón el siguiente evento en subtareas específicas y accionables.

EVENTO:
- Título: {event_data.get('title', 'Sin título')}
- Descripción: {event_data.get('description', 'Sin descripción')}
- Fecha: {event_data.get('date', 'Por definir')}
- Hora: {event_data.get('time', 'Por definir')}
- Ubicación: {event_data.get('location', 'Por definir')}
- Capacidad: {event_data.get('capacity', 'Por definir')} personas
- Categoría: {event_data.get('category', 'General')}

INSTRUCCIONES:
1. Genera entre 5 y 8 subtareas concretas
2. Cada tarea debe ser específica y medible
3. Incluye prioridad (high/medium/low)
4. Considera: reservas, logística, promoción, presupuesto, permisos

FORMATO DE RESPUESTA (JSON):
[
  {{
    "name": "Nombre de la tarea",
    "description": "Descripción detallada",
    "priority": "high/medium/low",
    "estimatedDuration": "X horas/días",
    "dependencies": ["tarea1", "tarea2"] o []
  }}
]

Responde SOLO con el JSON, sin texto adicional.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text: str, event_id: str) -> List[dict]:
        """
        Parsear respuesta de Gemini y convertir a formato de tareas
        """
        try:
            # Intentar extraer JSON de la respuesta
            # Gemini a veces incluye markdown, limpiarlo
            json_text = response_text.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:]
            if json_text.endswith('```'):
                json_text = json_text[:-3]
            
            tasks_data = json.loads(json_text.strip())
            
            # Convertir a formato del sistema
            subtasks = []
            for i, task_data in enumerate(tasks_data):
                subtask = {
                    'id': f'{event_id}-task-{i+1}',
                    'name': task_data.get('name', f'Tarea {i+1}'),
                    'description': task_data.get('description', ''),
                    'status': 'pending',
                    'priority': task_data.get('priority', 'medium'),
                    'estimatedDuration': task_data.get('estimatedDuration', 'Por estimar'),
                    'dependencies': task_data.get('dependencies', []),
                    'assignedTo': 'agent_executor',
                    'completed': False
                }
                subtasks.append(subtask)
            
            return subtasks
            
        except Exception as e:
            logger.error(f"[PLANNER-GEMINI] Error parseando respuesta: {e}")
            logger.debug(f"Respuesta: {response_text}")
            # Fallback
            return self._generate_tasks_simulation({'id': event_id})
    
    def _generate_tasks_simulation(self, event_data: dict) -> List[dict]:
        """
        Generar tareas simuladas (sin IA)
        """
        event_id = event_data.get('id', 'unknown')
        event_title = event_data.get('title', 'Evento')
        
        subtasks = [
            {
                'id': f'{event_id}-task-1',
                'name': 'Reservar espacio',
                'description': f'Reservar {event_data.get("location", "espacio")} para {event_data.get("date", "fecha")}',
                'status': 'pending',
                'priority': 'high',
                'estimatedDuration': '2 días',
                'dependencies': [],
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-2',
                'name': 'Contratar servicios',
                'description': f'Contratar servicios (audio, catering, etc.) para {event_title}',
                'status': 'pending',
                'priority': 'medium',
                'estimatedDuration': '3 días',
                'dependencies': ['Reservar espacio'],
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-3',
                'name': 'Gestionar presupuesto',
                'description': f'Calcular y aprobar presupuesto para {event_data.get("capacity", "N/A")} personas',
                'status': 'pending',
                'priority': 'high',
                'estimatedDuration': '1 día',
                'dependencies': ['Contratar servicios'],
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-4',
                'name': 'Coordinar logística',
                'description': 'Organizar transporte, señalización y personal',
                'status': 'pending',
                'priority': 'medium',
                'estimatedDuration': '4 días',
                'dependencies': ['Reservar espacio'],
                'assignedTo': 'agent_executor',
                'completed': False
            },
            {
                'id': f'{event_id}-task-5',
                'name': 'Promoción del evento',
                'description': 'Crear materiales y difundir en redes sociales',
                'status': 'pending',
                'priority': 'low',
                'estimatedDuration': '5 días',
                'dependencies': [],
                'assignedTo': 'agent_executor',
                'completed': False
            }
        ]
        
        return subtasks
    
    async def get_task_status(self, task_id: str) -> dict:
        """Obtener estado de tarea"""
        for event_id, task_data in self.tasks.items():
            for task in task_data['subtasks']:
                if task['id'] == task_id:
                    return task
        return {'error': 'Task not found'}
    
    async def update_task_status(self, task_id: str, status: str) -> bool:
        """Actualizar estado de tarea"""
        for event_id, task_data in self.tasks.items():
            for task in task_data['subtasks']:
                if task['id'] == task_id:
                    task['status'] = status
                    if status == 'completed':
                        task['completed'] = True
                    logger.info(f"[PLANNER-GEMINI] Tarea {task_id} → {status}")
                    return True
        return False


# ============================================
# INSTRUCCIONES DE INTEGRACIÓN
# ============================================

"""
PASO 1: Instalar dependencias
------------------------------
pip install google-generativeai

PASO 2: Obtener API Key
-----------------------
1. Ir a https://makersuite.google.com/app/apikey
2. Crear API key
3. Copiar la key

PASO 3: Configurar variable de entorno
--------------------------------------
Windows PowerShell:
$env:GEMINI_API_KEY = "tu-api-key-aqui"

Windows CMD:
set GEMINI_API_KEY=tu-api-key-aqui

Linux/Mac:
export GEMINI_API_KEY="tu-api-key-aqui"

PASO 4: Modificar backend_api.py
--------------------------------
Reemplazar:
    from backend_api import PlannerAgent
    
Con:
    from gemini_integration import GeminiPlannerAgent as PlannerAgent

Y en WebSocketServer.__init__:
    self.planner_agent = PlannerAgent('agent_planner@localhost')

PASO 5: Reiniciar el servidor
-----------------------------
python backend_api.py

PASO 6: Probar
--------------
Crear un evento desde el Dashboard y verificar que:
- Las tareas generadas son más inteligentes y contextuales
- La descripción es más detallada
- Las prioridades son más precisas
- Se incluyen dependencias entre tareas
"""


# ============================================
# EJEMPLO DE USO
# ============================================

async def ejemplo_uso():
    """Ejemplo de cómo usar GeminiPlannerAgent"""
    
    # Inicializar agente
    planner = GeminiPlannerAgent(
        agent_id='agent_planner@localhost',
        api_key='TU_API_KEY'  # O usa variable de entorno
    )
    
    # Datos del evento
    event_data = {
        'id': 'event-demo-001',
        'title': 'Hackathon de Inteligencia Artificial 2025',
        'description': 'Competencia de 48 horas donde estudiantes desarrollan soluciones con IA',
        'date': '2025-12-15',
        'time': '08:00',
        'location': 'Laboratorio de Computación A',
        'capacity': 100,
        'category': 'Tecnología'
    }
    
    # Procesar planificación
    result = await planner.process_event_planning(event_data, 'conv-demo-001')
    
    print("=== RESULTADO DE PLANIFICACIÓN ===")
    print(f"Event ID: {result['eventId']}")
    print(f"Status: {result['status']}")
    print(f"Message: {result['message']}")
    print(f"\nSubtareas generadas: {len(result['tasks'])}")
    
    for task in result['tasks']:
        print(f"\n- {task['name']}")
        print(f"  Descripción: {task['description']}")
        print(f"  Prioridad: {task['priority']}")
        print(f"  Duración estimada: {task.get('estimatedDuration', 'N/A')}")
        if task.get('dependencies'):
            print(f"  Dependencias: {', '.join(task['dependencies'])}")


if __name__ == '__main__':
    import asyncio
    from datetime import datetime
    
    print("=== DEMO: Integración con Gemini ===")
    print("\nNOTA: Este es un ejemplo. Para usar:")
    print("1. Instalar: pip install google-generativeai")
    print("2. Configurar: GEMINI_API_KEY en variables de entorno")
    print("3. Descomentar imports de google.generativeai")
    print("4. Ejecutar: python gemini_integration.py")
    print("\n" + "="*50 + "\n")
    
    # asyncio.run(ejemplo_uso())
