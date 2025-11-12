import { useState, useEffect } from 'react';
import agentService from '../services/agentService';
import eventService from '../services/eventService';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    category: 'Académico'
  });

  useEffect(() => {
    loadData();
    setupAgentListeners();

    agentService.connect('ws://localhost:8081/ws').catch(err => {
      console.warn('No se pudo conectar al sistema de agentes:', err);
    });

    return () => {
      // Limpiar listeners
    };
  }, []);

  const loadData = () => {
    setEvents(eventService.getEvents());
    setStats(eventService.getStats());
  };

  const setupAgentListeners = () => {
    window.addEventListener('agent-planning-response', handlePlanningResponse);
    window.addEventListener('agent-task-update', handleTaskUpdate);
    window.addEventListener('agent-task-complete', handleTaskComplete);
  };

  const handlePlanningResponse = (event) => {
    const { detail } = event;
    addAgentMessage('Respuesta de planificación recibida', detail);
    
    if (detail.eventId && detail.tasks) {
      eventService.updateEventTasks(detail.eventId, detail.tasks);
      loadData();
    }
  };

  const handleTaskUpdate = (event) => {
    const { detail } = event;
    addAgentMessage('Actualización de tarea', detail);
  };

  const handleTaskComplete = (event) => {
    const { detail } = event;
    addAgentMessage('Tarea completada', detail);
  };

  const addAgentMessage = (type, data) => {
    setAgentMessages(prev => [{
      type,
      data,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 10));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    const newEvent = eventService.createEvent(eventForm);
    
    try {
      addAgentMessage('Solicitando planificación', newEvent);
      
      const response = await agentService.requestEventPlanning({
        eventId: newEvent.id,
        eventData: newEvent
      });
      
      addAgentMessage('Planificación iniciada', response);
      
    } catch (error) {
      console.error('Error al comunicarse con el agente:', error);
      addAgentMessage('Error', { error: error.message });
    }
    
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: '',
      category: 'Académico'
    });
    setShowEventForm(false);
    loadData();
  };

  const handleUpdateEvent = (eventId, updates) => {
    eventService.updateEvent(eventId, updates);
    agentService.updateEventInfo(eventId, updates);
    loadData();
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('¿Estás seguro de eliminar este evento?')) {
      eventService.deleteEvent(eventId);
      loadData();
    }
  };

  const viewEventDetails = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con gradiente */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 px-8 py-12 shadow-2xl">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h1 className="text-4xl font-bold text-white mb-3">
                Dashboard de Organizadores
              </h1>
              <p className="text-primary-100 text-lg max-w-2xl">
                Sistema Multi-Agente de Gestión de Eventos Universitarios con IA
              </p>
              <div className="flex items-center space-x-4 mt-6">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">Sistema Activo</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-4 h-4 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white text-sm font-medium">AG-UI Protocol</span>
                </div>
              </div>
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
          </div>
        </div>

        {/* Estadísticas mejoradas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              title="Total Eventos" 
              value={stats.totalEvents} 
              icon={<ChartIcon />}
              color="blue"
              trend="+12%"
              description="vs. mes anterior"
            />
            <StatCard 
              title="Próximos Eventos" 
              value={stats.upcomingEvents} 
              icon={<CalendarIcon />}
              color="green"
              trend="+5"
              description="esta semana"
            />
            <StatCard 
              title="Registros Activos" 
              value={stats.totalRegistrations} 
              icon={<UsersIcon />}
              color="purple"
              trend="+23%"
              description="incremento mensual"
            />
            <StatCard 
              title="Satisfacción" 
              value={`${stats.averageRating}/5`} 
              icon={<StarIcon />}
              color="yellow"
              trend="Excelente"
              description="calificación promedio"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel principal - Lista de eventos */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Gestión de Eventos
                  </h2>
                  <p className="text-gray-600">Administra y organiza eventos universitarios</p>
                </div>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="btn btn-primary px-6 py-3 text-sm flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Crear Evento</span>
                </button>
              </div>

              {/* Formulario de nuevo evento mejorado */}
              {showEventForm && (
                <div className="mb-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Nuevo Evento</h3>
                  </div>
                  <form onSubmit={handleCreateEvent}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Título del Evento
                        </label>
                        <input
                          type="text"
                          required
                          value={eventForm.title}
                          onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                          className="input text-lg"
                          placeholder="Ej: Hackathon Universitario 2025"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Descripción
                        </label>
                        <textarea
                          required
                          value={eventForm.description}
                          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                          className="input"
                          rows="4"
                          placeholder="Describe el evento, objetivos y beneficios para los estudiantes..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Fecha
                        </label>
                        <input
                          type="date"
                          required
                          value={eventForm.date}
                          onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Hora
                        </label>
                        <input
                          type="time"
                          required
                          value={eventForm.time}
                          onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          required
                          value={eventForm.location}
                          onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                          className="input"
                          placeholder="Auditorio Principal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Capacidad
                        </label>
                        <input
                          type="number"
                          required
                          value={eventForm.capacity}
                          onChange={(e) => setEventForm({...eventForm, capacity: e.target.value})}
                          className="input"
                          placeholder="100"
                          min="1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Categoría
                        </label>
                        <select
                          value={eventForm.category}
                          onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
                          className="input"
                        >
                          <option>Académico</option>
                          <option>Tecnología</option>
                          <option>Cultural</option>
                          <option>Deportivo</option>
                          <option>Social</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex gap-4">
                      <button
                        type="submit"
                        className="btn btn-primary px-8 py-3 shadow-lg hover:shadow-xl transition-all"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Crear y Planificar con IA
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEventForm(false)}
                        className="btn btn-secondary px-8 py-3"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de eventos */}
              <div className="space-y-4">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                    onViewDetails={viewEventDetails}
                  />
                ))}
                {events.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo evento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral - Monitor de agentes mejorado */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <span>Centro de Control IA</span>
              </h2>
              
              <div className="space-y-4 mb-8">
                <AgentStatus 
                  name="UI Agent" 
                  status={agentService.wsConnection ? 'connected' : 'disconnected'}
                  description="Interfaz de usuario"
                />
                <AgentStatus 
                  name="Planificador Gemini" 
                  status="active" 
                  description="Inteligencia artificial"
                />
                <AgentStatus 
                  name="Coordinador ACP" 
                  status="processing" 
                  description="Protocolo multi-agente"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>Actividad Reciente</span>
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {agentMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm text-gray-500">Esperando actividad...</p>
                    </div>
                  ) : (
                    agentMessages.map((msg, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200/50 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-primary-700">{msg.type}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-white rounded p-3 border border-gray-100">
                          <pre className="text-xs text-gray-700 overflow-auto whitespace-pre-wrap break-words max-h-32">
                            {JSON.stringify(msg.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de detalles de evento */}
        {selectedEvent && (
          <EventDetailsModal 
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    </div>
  );
}

// Iconos SVG
function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

// Componente de tarjeta de estadística mejorado
function StatCard({ title, value, icon, color, trend, description }) {
  const colors = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      accent: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-500/20'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      accent: 'bg-green-50',
      text: 'text-green-600',
      ring: 'ring-green-500/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      accent: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-500/20'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      accent: 'bg-yellow-50',
      text: 'text-yellow-600',
      ring: 'ring-yellow-500/20'
    }
  };

  const colorConfig = colors[color];

  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 ring-1 ${colorConfig.ring}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorConfig.bg} flex items-center justify-center shadow-lg`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colorConfig.accent} ${colorConfig.text}`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de evento
function EventCard({ event, onUpdate, onDelete, onViewDetails }) {
  const statusConfig = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pendiente' },
    planning: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En Planificación' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
    completed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Completado' }
  };

  const config = statusConfig[event.status] || statusConfig.pending;

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 flex-1">{event.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{event.date}</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{event.time}</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{event.registrations}/{event.capacity}</span>
        </div>
      </div>
      {event.tasks && event.tasks.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Tareas de planificación:</p>
          <div className="space-y-1">
            {event.tasks.slice(0, 3).map((task, idx) => (
              <div key={idx} className="text-xs text-gray-600 flex items-center space-x-2">
                <span className={task.completed ? 'text-green-600 font-bold' : 'text-gray-400'}>
                  {task.completed ? '✓' : '○'}
                </span>
                <span className="truncate">{task.name}</span>
              </div>
            ))}
            {event.tasks.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">+{event.tasks.length - 3} más...</div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onViewDetails(event)}
          className="text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg transition font-medium"
        >
          Ver Detalles
        </button>
        <button
          onClick={() => onUpdate(event.id, { status: 'approved' })}
          className="text-sm bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition font-medium"
        >
          Aprobar
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition font-medium"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

// Componente de estado de agente mejorado
function AgentStatus({ name, status, description }) {
  const statusConfig = {
    connected: { 
      color: 'bg-green-500', 
      label: 'Conectado',
      ring: 'ring-green-500/30',
      bg: 'bg-green-50',
      text: 'text-green-700'
    },
    active: { 
      color: 'bg-blue-500', 
      label: 'Activo',
      ring: 'ring-blue-500/30',
      bg: 'bg-blue-50',
      text: 'text-blue-700'
    },
    processing: { 
      color: 'bg-purple-500', 
      label: 'Procesando',
      ring: 'ring-purple-500/30',
      bg: 'bg-purple-50',
      text: 'text-purple-700'
    },
    disconnected: { 
      color: 'bg-gray-400', 
      label: 'Desconectado',
      ring: 'ring-gray-400/30',
      bg: 'bg-gray-50',
      text: 'text-gray-700'
    },
    error: { 
      color: 'bg-red-500', 
      label: 'Error',
      ring: 'ring-red-500/30',
      bg: 'bg-red-50',
      text: 'text-red-700'
    }
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${config.bg} ${config.text} border-current/20`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{name}</span>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse ring-4 ${config.ring}`} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
      {description && (
        <p className="text-xs opacity-75">{description}</p>
      )}
    </div>
  );
}

// Modal de detalles de evento
function EventDetailsModal({ event, onClose }) {
  const registrations = eventService.getEventRegistrations(event.id);
  const feedback = eventService.getEventFeedback(event.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</h3>
              <p className="text-gray-600">{event.date} a las {event.time}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Ubicación</h3>
              <p className="text-gray-600">{event.location}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Registros ({registrations.length}/{event.capacity})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {registrations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay registros aún</p>
              ) : (
                registrations.map(reg => (
                  <div key={reg.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-medium text-sm text-gray-900">{reg.name}</div>
                    <div className="text-gray-600 text-xs mt-1">{reg.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Feedback ({feedback.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {feedback.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay feedback aún</p>
              ) : (
                feedback.map(fb => (
                  <div key={fb.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-500 text-sm">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5-fb.rating)}
                      </span>
                      <span className="text-xs text-gray-500">{fb.studentName}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{fb.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
