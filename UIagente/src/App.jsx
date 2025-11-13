import { useState, useEffect } from 'react'
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  UsersIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  HomeIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  FireIcon,
  LightBulbIcon,
  TrophyIcon,
  UserGroupIcon,
  StarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import {
  CalendarDaysIcon as CalendarDaysIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  BellIcon as BellIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [events, setEvents] = useState([])
  const [plans, setPlans] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [executingPlanId, setExecutingPlanId] = useState(null)
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
    setExecutingPlanId(planId)
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
      setExecutingPlanId(null)
    }
  }

  const handleReplanEvent = async (eventId, eventName) => {
    if (!confirm(`¿Deseas generar un nuevo plan para el evento "${eventName}"?`)) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/replan`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Replan response:', data)
      
      if (data.status === 'success') {
        await fetchPlans()
        await fetchNotifications()
        const tasksCount = data.payload?.plan?.total_tasks || 0
        alert(`Nuevo plan generado exitosamente con ${tasksCount} tareas.`)
        setActiveView('plans')
      } else {
        alert(`Error: ${data.payload?.error || 'Error desconocido al generar plan'}`)
      }
    } catch (error) {
      console.error('Error replanning event:', error)
      alert(`Error al generar nuevo plan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Navigation */}
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-xl border-b-4 border-red-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/30">
                  <FireIcon className="w-9 h-9 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">EventHub</h1>
                <p className="text-white text-base font-semibold">Sistema de Gestión de Eventos Universitarios</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-2xl border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'dashboard'
                  ? 'border-white text-white bg-white/20'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <HomeIcon className="w-6 h-6" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('events')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'events'
                  ? 'border-white text-white bg-white/20'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <CalendarDaysIcon className="w-6 h-6" />
              <span>Eventos</span>
            </button>
            
            <button
              onClick={() => setActiveView('plans')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'plans'
                  ? 'border-white text-white bg-white/20'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <ClipboardDocumentListIcon className="w-6 h-6" />
              <span>Planificación</span>
            </button>
            
            <button
              onClick={() => setActiveView('notifications')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 relative ${
                activeView === 'notifications'
                  ? 'border-white text-white bg-white/20'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <BellIcon className="w-6 h-6" />
              <span>Notificaciones</span>
              {notifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-white animate-bounce">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <DashboardView 
            events={events}
            plans={plans}
            notifications={notifications}
            loading={loading}
            onCreateEvent={() => {
              setShowEventForm(true)
              setActiveView('events')
            }}
            onViewPlans={() => setActiveView('plans')}
            onViewNotifications={() => setActiveView('notifications')}
          />
        )}

        {activeView === 'events' && (
          <EventsView
            events={events}
            showForm={showEventForm}
            setShowForm={setShowEventForm}
            onCreateEvent={handleCreateEvent}
            onReplanEvent={handleReplanEvent}
            loading={loading}
          />
        )}

        {activeView === 'plans' && (
          <PlansView
            plans={plans}
            onExecute={handleExecutePlan}
            loading={loading}
            executingPlanId={executingPlanId}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        )}

        {activeView === 'notifications' && (
          <NotificationsView notifications={notifications} />
        )}
      </main>
    </div>
  )
}

function DashboardView({ events, plans, notifications, loading, onCreateEvent, onViewPlans, onViewNotifications }) {
  const totalEvents = events.length
  const totalPlans = plans.length
  const totalNotifications = notifications.length
  const pendingPlans = plans.filter(p => p.status === 'created').length
  const completedEvents = events.filter(e => e.status === 'completed').length
  const activeEvents = events.filter(e => e.status === 'executing').length

  const stats = [
    {
      name: 'Eventos Totales',
      value: totalEvents,
      icon: CalendarDaysIcon,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      name: 'Planes Activos',
      value: pendingPlans,
      icon: RocketLaunchIcon,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Eventos Completados',
      value: completedEvents,
      icon: TrophyIcon,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Notificaciones',
      value: totalNotifications,
      icon: BellIcon,
      color: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ]

  const quickActions = [
    {
      name: 'Crear Nuevo Evento',
      description: 'Organiza un evento universitario',
      icon: PlusIcon,
      color: 'from-red-500 to-red-600',
      action: onCreateEvent
    },
    {
      name: 'Ver Planes',
      description: 'Gestionar planificación',
      icon: ChartPieIcon,
      color: 'from-blue-500 to-blue-600',
      action: onViewPlans
    },
    {
      name: 'Notificaciones',
      description: 'Revisar actualizaciones',
      icon: BellIcon,
      color: 'from-green-500 to-green-600',
      action: onViewNotifications
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-6">
            
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">¡Bienvenido al Dashboard!</h1>
              <p className="text-xl text-white font-medium">Gestiona tus eventos universitarios de manera eficiente</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-white/90 text-lg leading-relaxed">
              Bienvenido a tu centro de control para eventos universitarios. 
              Desde aquí puedes gestionar todos tus eventos, revisar planes de ejecución y mantenerte al día con las notificaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border-2 ${stat.borderColor} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.name}</p>
                <p className={`text-4xl font-bold ${stat.textColor} mt-2`}>{stat.value}</p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/20`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-white mb-2">{action.name}</h3>
                <p className="text-gray-600 group-hover:text-gray-100">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Eventos Recientes</h2>
          <button
            onClick={onViewPlans}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Ver Todos
          </button>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay eventos</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primer evento</p>
            <button
              onClick={onCreateEvent}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Crear Evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((event) => (
              <div key={event.event_id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-200">
                <h3 className="font-bold text-gray-900 mb-2">{event.event_name}</h3>
                <p className="text-sm text-gray-600 mb-2 capitalize">{event.event_type}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{event.expected_attendees} asistentes</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventsView({ events, showForm, setShowForm, onCreateEvent, onReplanEvent, loading }) {
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

  const getEventTypeIcon = (type) => {
    const icons = {
      academico: '🎓',
      cultural: '🎭',
      deportivo: '⚽',
      social: '🎉'
    }
    return icons[type] || '📅'
  }

  const getStatusConfig = (status) => {
    const configs = {
      planning: {
        color: 'bg-blue-100 text-blue-900 border-blue-300',
        text: 'Planificando'
      },
      executing: {
        color: 'bg-red-100 text-red-900 border-red-300',
        text: 'En Ejecución'
      },
      completed: {
        color: 'bg-green-100 text-green-900 border-green-300',
        text: 'Completado'
      }
    }
    return configs[status] || configs.planning
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-8 md:p-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center border-2 border-white/30">
              <CalendarDaysIcon className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Gestión de Eventos</h2>
              <p className="text-white/90 mt-2 text-lg">Organiza y planifica eventos universitarios de manera eficiente</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`inline-flex items-center px-8 py-4 border-2 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 ${
              showForm 
                ? 'bg-gray-900 text-white border-gray-900 hover:bg-black focus:ring-white' 
                : 'bg-white text-red-700 border-white hover:bg-gray-50 focus:ring-red-500'
            } focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-red-600`}
          >
            {showForm ? (
              <>
                <XMarkIcon className="w-6 h-6 mr-3" />
                Cancelar
              </>
            ) : (
              <>
                <PlusIcon className="w-6 h-6 mr-3" />
                Nuevo Evento
              </>
            )}
          </button>
        </div>
      </div>

      {/* Event Creation Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-black px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Crear Nuevo Evento</h3>
                <p className="text-gray-300 text-base mt-1">Complete los detalles del evento universitario</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-lg hover:border-red-300"
                  placeholder="Ej: Congreso de Ingeniería 2024"
                  required
                />
              </div>
              
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Categoría del Evento
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-lg hover:border-red-300"
                >
                  <option value="academico">Académico</option>
                  <option value="cultural">Cultural</option>
                  <option value="deportivo">Deportivo</option>
                  <option value="social">Social</option>
                </select>
              </div>
              
              <div>
                <label className="block text-base font-bold text-black mb-3">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-black bg-white shadow-black"
                  required
                />
              </div>
              
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Asistentes Esperados
                </label>
                <div className="relative">
                  <UsersIcon className="absolute left-4 top-4 h-6 w-6 text-red-600" />
                  <input
                    type="number"
                    value={formData.expected_attendees}
                    onChange={(e) => setFormData({...formData, expected_attendees: parseInt(e.target.value)})}
                    className="w-full pl-12 pr-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-black bg-white shadow-black"
                    placeholder="50"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Presupuesto (USD)
                </label>
                <div className="relative">
                  <BanknotesIcon className="absolute left-4 top-4 h-6 w-6 text-red-600" />
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-black bg-white shadow-black"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-base font-bold text-black mb-3">
                  Descripción del Evento
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-black bg-white shadow-black"
                  rows="5"
                  placeholder="Describe los objetivos, actividades y detalles del evento..."
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-base font-bold text-black mb-3">
                  Email del Organizador
                </label>
                <input
                  type="email"
                  value={formData.organizer_email}
                  onChange={(e) => setFormData({...formData, organizer_email: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-black bg-white shadow-black"
                  placeholder="organizador@universidad.edu"
                  required
                />
              </div>
            </div>
            
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-gradient text-white px-8 py-5 rounded-xl font-bold text-lg shadow-red-lg hover:shadow-red border-3 border-red-800 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] uppercase tracking-wide"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3"></div>
                    Creando Evento...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 mr-3" />
                    Crear Evento y Generar Plan
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 text-center py-16">
            <div className="bg-red-gradient rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-red-lg">
              <CalendarDaysIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-black">No hay eventos</h3>
            <p className="mt-2 text-base text-gray-600 font-medium">Comienza creando tu primer evento universitario.</p>
          </div>
        ) : (
          events.map((event) => {
            const statusConfig = getStatusConfig(event.status)
            return (
              <div key={event.event_id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-red-300 overflow-hidden transform hover:scale-[1.02]">
                <div className="bg-gradient-to-r from-red-500 to-red-600 h-1"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{event.event_name}</h3>
                        <p className="text-sm text-gray-600 capitalize font-medium">{event.event_type}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="w-4 h-4 mr-2 text-red-500" />
                      {new Date(event.event_date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <UsersIcon className="w-4 h-4 mr-2 text-red-500" />
                        {event.expected_attendees} asistentes
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BanknotesIcon className="w-4 h-4 mr-2 text-red-500" />
                        ${event.budget.toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => onReplanEvent(event.event_id, event.event_name)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Generar nuevo plan para este evento"
                    >
                      <ArrowPathIcon className="w-4 h-4 inline mr-2" />
                      Replantear Evento
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function PlansView({ plans, onExecute, loading, executingPlanId, selectedPlan, setSelectedPlan }) {
  const getStatusConfig = (status) => {
    const configs = {
      created: {
        color: 'bg-red-100 text-red-800 border-red-300',
        text: 'Listo para Ejecutar',
        icon: ClockIcon
      },
      sent_to_executor: {
        color: 'bg-black text-white border-black',
        text: 'En Progreso',
        icon: PlayIcon
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        text: 'Completado',
        icon: CheckCircleIcon
      }
    }
    return configs[status] || configs.created
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-600 text-white border-red-700',
      medium: 'bg-black text-white border-black',
      low: 'bg-gray-600 text-white border-gray-700'
    }
    return colors[priority] || colors.medium
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-8 md:p-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
        <div className="relative flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center border-2 border-white/30">
            <ClipboardDocumentListIcon className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Planificación de Eventos</h2>
            <p className="text-white/90 mt-2 text-lg">Gestiona y ejecuta los planes generados para tus eventos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Plans List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Planes Disponibles</h3>
              </div>
              <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-2 rounded-full">
                {plans.length} {plans.length === 1 ? 'plan' : 'planes'}
              </span>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay planes</h3>
              <p className="text-gray-600">Los planes se generarán automáticamente al crear eventos.</p>
            </div>
          ) : (
            plans.map((plan) => {
              const isExecuting = executingPlanId === plan.plan_id
              const isSelected = selectedPlan?.plan_id === plan.plan_id
              const statusConfig = getStatusConfig(plan.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={plan.plan_id}
                  className={`bg-white rounded-2xl border-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected 
                      ? 'border-red-500 shadow-red-lg bg-red-50' 
                      : 'border-black/20 hover:border-red-400 shadow-black-lg hover:shadow-premium'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="bg-red-gradient h-3 rounded-t-xl"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-black mb-3 leading-tight">
                          {plan.event_details.event_name}
                        </h4>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${statusConfig.color} shadow-black`}>
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
                      <p className="text-sm text-black font-medium leading-relaxed">{plan.plan_summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200">
                        <div className="flex items-center text-red-800 font-bold">
                          <ChartBarIcon className="w-4 h-4 mr-2" />
                          {plan.total_tasks}
                        </div>
                        <p className="text-xs text-red-600 font-medium mt-1">Tareas</p>
                      </div>
                      <div className="bg-black/5 rounded-xl p-3 border-2 border-black/20">
                        <div className="flex items-center text-black font-bold">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          {plan.estimated_duration}
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1">Duración</p>
                      </div>
                    </div>
                    
                    {plan.status === 'created' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onExecute(plan.plan_id)
                        }}
                        disabled={loading}
                        className="w-full bg-red-gradient text-black px-6 py-4 rounded-xl font-bold text-base hover:shadow-red border-3 border-red-800 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] uppercase tracking-wide"
                      >
                        {isExecuting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white mr-3"></div>
                            Ejecutando Plan...
                          </div>
                        ) : loading ? (
                          <div className="flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 mr-3" />
                            Sistema Ocupado...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <PlayIcon className="w-5 h-5 mr-3" />
                            Ejecutar Plan
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Plan Details */}
        <div className="xl:col-span-3">
          {selectedPlan ? (
            <div className="bg-white rounded-2xl shadow-premium border-4 border-black/20">
              <div className="bg-red-gradient rounded-t-2xl px-8 py-6 border-b-4 border-red-800">
                <h3 className="text-2xl font-bold text-black tracking-tight">Detalles del Plan</h3>
                <p className="text-red-600 text-base mt-2 font-medium">{selectedPlan.event_details.event_name}</p>
              </div>
              
              <div className="p-8">
                <div className="mb-8">
                  <h4 className="text-base font-bold text-black uppercase tracking-wide mb-4 border-b-2 border-red-600 pb-2">
                    Resumen del Plan
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-6 border-3 border-gray-200">
                    <p className="text-black font-medium leading-relaxed">{selectedPlan.plan_summary}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-base font-bold text-black uppercase tracking-wide mb-4 border-b-2 border-red-600 pb-2">
                    Tareas del Plan ({selectedPlan.tasks.length})
                  </h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedPlan.tasks.map((task, index) => (
                      <div key={task.task_id} className="bg-white rounded-xl p-6 border-4 border-red-100 shadow-black hover:shadow-black-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <h5 className="font-bold text-lg text-black leading-tight">
                            {index + 1}. {task.task_name}
                          </h5>
                          <span className={`px-3 py-2 rounded-full text-sm font-bold border-2 ${getPriorityColor(task.priority)} shadow-black uppercase`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
                          <p className="text-sm text-black font-medium leading-relaxed">{task.description}</p>
                        </div>
                        
                        {task.dependencies.length > 0 && (
                          <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200">
                            <div className="flex items-center text-sm text-red-800 font-bold">
                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                              Dependencias: {task.dependencies.length}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-4 border-red-600 pt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-red-gradient rounded-xl p-6 shadow-red-lg border-2 border-red-800">
                      <div className="flex items-center text-black mb-2">
                        <ChartBarIcon className="w-6 h-6 mr-3" />
                        Total de Tareas
                      </div>
                      <p className="text-black font-bold text-3xl">{selectedPlan.total_tasks}</p>
                    </div>
                    <div className="bg-black-gradient rounded-xl p-6 shadow-black-lg border-2 border-black">
                      <div className="flex items-center text-black mb-2">
                        <ClockIcon className="w-6 h-6 mr-3" />
                        Duración Estimada
                      </div>
                      <p className="text-black font-bold text-3xl">{selectedPlan.estimated_duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-premium border-4 border-black/20 p-16 text-center">
              <div className="bg-red-gradient rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-red-lg">
                <EyeIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-black">Selecciona un Plan</h3>
              <p className="mt-2 text-base text-gray-600 font-medium">
                Haz clic en cualquier plan de la lista para ver sus detalles completos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationsView({ notifications }) {
  const getLevelConfig = (level) => {
    const configs = {
      success: {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500',
        icon: CheckCircleIconSolid
      },
      error: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        icon: XCircleIconSolid
      },
      warning: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500',
        icon: ExclamationTriangleIconSolid
      },
      info: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500',
        icon: InformationCircleIconSolid
      }
    }
    return configs[level] || configs.info
  }

  const getTypeColor = (type) => {
    const colors = {
      execution: 'bg-red-600 text-white border-red-700',
      planning: 'bg-black text-white border-black',
      system: 'bg-gray-600 text-white border-gray-700',
      general: 'bg-gray-600 text-white border-gray-700'
    }
    return colors[type] || colors.general
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-8 md:p-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center border-2 border-white/30">
              <BellIcon className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Centro de Notificaciones</h2>
              <p className="text-white/90 mt-2 text-lg">Mantente informado sobre el estado de tus eventos y planes</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <BellIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notificaciones</h3>
            <p className="text-gray-600">
              Cuando ejecutes planes o haya actualizaciones del sistema, aparecerán aquí.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const notifData = notification.payload || notification
            const levelConfig = getLevelConfig(notifData.level)
            const LevelIcon = levelConfig.icon

            return (
              <div
                key={notifData.notification_id || Math.random()}
                className={`bg-white rounded-xl shadow-custom border-l-4 ${levelConfig.borderColor} ${levelConfig.bgColor} border border-secondary-200 overflow-hidden transition-all duration-200 hover:shadow-custom-lg`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 ${levelConfig.iconColor}`}>
                      <LevelIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${levelConfig.textColor}`}>
                            {notifData.title}
                          </h3>
                          <p className="text-secondary-700 mt-2 leading-relaxed">
                            {notifData.body}
                          </p>
                          
                          {notifData.timestamp && (
                            <div className="flex items-center mt-4 text-sm text-secondary-500">
                              <ClockIcon className="w-4 h-4 mr-2" />
                              {new Date(notifData.timestamp).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(notifData.type)}`}>
                            {notifData.type || 'general'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default App

