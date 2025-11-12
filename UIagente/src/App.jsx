import { useState, useEffect } from 'react'

function App() {
  const [activeView, setActiveView] = useState('events')
  const [events, setEvents] = useState([])
  const [plans, setPlans] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const API_BASE = 'http://localhost:8000/api'

  useEffect(() => {
    fetchEvents()
    fetchPlans()
    fetchNotifications()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/events`)
      const data = await response.json()
      if (data.payload && data.payload.events) {
        setEvents(data.payload.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/plans`)
      const data = await response.json()
      if (data.payload && data.payload.plans) {
        setPlans(data.payload.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications`)
      const data = await response.json()
      if (data.payload) {
        const allNotifications = [
          ...(data.payload.pending || []),
          ...(data.payload.history || [])
        ]
        setNotifications(allNotifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleCreateEvent = async (eventData) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Plan creation response:', data)
      
      if (data.status === 'success') {
        await fetchEvents()
        await fetchPlans()
        await fetchNotifications()
        setShowEventForm(false)
        const tasksCount = data.payload?.plan?.total_tasks || 0
        alert(`Evento creado exitosamente. Plan generado con ${tasksCount} tareas.`)
      } else {
        alert(`Error: ${data.payload?.error || 'Error desconocido al crear evento'}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert(`Error al crear evento: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExecutePlan = async (planId) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/execute/${planId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Execution response:', data)
      
      if (data.status === 'success') {
        await fetchNotifications()
        await fetchPlans()
        const summary = data.payload?.summary
        const resultsCount = summary?.total || data.payload?.results?.length || 0
        const errors = summary?.errors || 0
        const successes = summary?.success || 0
        
        if (errors > 0) {
          alert(`Plan ejecutado: ${successes} tareas exitosas, ${errors} con errores de ${resultsCount} totales.\n\nRevisa las notificaciones para mas detalles.`)
        } else {
          alert(`Plan ejecutado exitosamente!\n\n${resultsCount} tareas completadas sin errores.`)
        }
      } else {
        const errorMsg = data.payload?.error || 'Error desconocido al ejecutar plan'
        alert(`Error al ejecutar plan:\n${errorMsg}`)
      }
    } catch (error) {
      console.error('Error executing plan:', error)
      alert(`Error al ejecutar plan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Sistema de Gestion de Eventos Escolares</h1>
          <p className="text-sm text-blue-100">Sistema Multiagente con Protocolos AG-UI, ANP, A2A y ACP</p>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveView('events')}
            className={`px-4 py-2 rounded ${activeView === 'events' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveView('plans')}
            className={`px-4 py-2 rounded ${activeView === 'plans' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Planes
          </button>
          <button
            onClick={() => setActiveView('notifications')}
            className={`px-4 py-2 rounded ${activeView === 'notifications' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Notificaciones ({notifications.length})
          </button>
        </div>

        {activeView === 'events' && (
          <EventsView
            events={events}
            showForm={showEventForm}
            setShowForm={setShowEventForm}
            onCreateEvent={handleCreateEvent}
            loading={loading}
          />
        )}

        {activeView === 'plans' && (
          <PlansView
            plans={plans}
            onExecute={handleExecutePlan}
            loading={loading}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        )}

        {activeView === 'notifications' && (
          <NotificationsView notifications={notifications} />
        )}
      </div>
    </div>
  )
}

function EventsView({ events, showForm, setShowForm, onCreateEvent, loading }) {
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'academico',
    event_date: '',
    expected_attendees: 50,
    budget: 1000,
    description: '',
    organizer_email: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreateEvent(formData)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Eventos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showForm ? 'Cancelar' : 'Crear Evento'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Nuevo Evento</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Evento</label>
              <input
                type="text"
                value={formData.event_name}
                onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="academico">Academico</option>
                <option value="cultural">Cultural</option>
                <option value="deportivo">Deportivo</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Asistentes Esperados</label>
              <input
                type="number"
                value={formData.expected_attendees}
                onChange={(e) => setFormData({...formData, expected_attendees: parseInt(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Presupuesto</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripcion</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded px-3 py-2"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email del Organizador</label>
              <input
                type="email"
                value={formData.organizer_email}
                onChange={(e) => setFormData({...formData, organizer_email: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creando...' : 'Crear Evento y Generar Plan'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.event_id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">{event.event_name}</h3>
            <p className="text-sm text-gray-600 mb-1">Tipo: {event.event_type}</p>
            <p className="text-sm text-gray-600 mb-1">Fecha: {event.event_date}</p>
            <p className="text-sm text-gray-600 mb-1">Asistentes: {event.expected_attendees}</p>
            <p className="text-sm text-gray-600 mb-1">Presupuesto: ${event.budget}</p>
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
            <span className={`inline-block px-2 py-1 rounded text-xs ${
              event.status === 'planning' ? 'bg-yellow-200 text-yellow-800' :
              event.status === 'executing' ? 'bg-blue-200 text-blue-800' :
              'bg-green-200 text-green-800'
            }`}>
              {event.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlansView({ plans, onExecute, loading, selectedPlan, setSelectedPlan }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Planes Generados</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition ${
                selectedPlan?.plan_id === plan.plan_id ? 'ring-2 ring-blue-600' : ''
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{plan.event_details.event_name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  plan.status === 'created' ? 'bg-blue-200 text-blue-800' :
                  plan.status === 'sent_to_executor' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{plan.plan_summary}</p>
              <p className="text-sm text-gray-500">Tareas: {plan.total_tasks}</p>
              <p className="text-sm text-gray-500">Duracion estimada: {plan.estimated_duration}</p>
              
              {plan.status === 'created' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onExecute(plan.plan_id)
                  }}
                  disabled={loading}
                  className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Ejecutando...' : 'Ejecutar Plan'}
                </button>
              )}
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">Detalles del Plan</h3>
            <div className="space-y-4">
              {selectedPlan.tasks.map((task, index) => (
                <div key={task.task_id} className="border-l-4 border-blue-600 pl-3">
                  <p className="font-semibold">{index + 1}. {task.task_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Prioridad: {task.priority}
                    </span>
                    {task.dependencies.length > 0 && (
                      <span className="text-xs bg-orange-200 px-2 py-1 rounded">
                        Dependencias: {task.dependencies.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationsView({ notifications }) {
  const getLevelColor = (level) => {
    const colors = {
      success: 'bg-green-100 border-green-500 text-green-800',
      error: 'bg-red-100 border-red-500 text-red-800',
      warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
      info: 'bg-blue-100 border-blue-500 text-blue-800'
    }
    return colors[level] || colors.info
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notificaciones del Sistema</h2>
      
      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
            No hay notificaciones
          </div>
        )}
        
        {notifications.map((notification) => {
          const notifData = notification.payload || notification
          return (
            <div
              key={notifData.notification_id || Math.random()}
              className={`p-4 rounded-lg border-l-4 ${getLevelColor(notifData.level)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold">{notifData.title}</h3>
                  <p className="text-sm mt-1">{notifData.body}</p>
                  {notifData.timestamp && (
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(notifData.timestamp).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold uppercase">
                  {notifData.type || 'general'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App

