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
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  UserPlusIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import {
  CalendarDaysIcon as CalendarDaysIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  BellIcon as BellIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
  UserGroupIcon as UserGroupIconSolid
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
  const [availableEvents, setAvailableEvents] = useState([])
  const [studentRegistrations, setStudentRegistrations] = useState([])
  const [studentInfo, setStudentInfo] = useState({ name: '', email: '', studentId: '' })
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [dashboardStats, setDashboardStats] = useState(null)

  const API_BASE = 'http://localhost:8000/api'

  useEffect(() => {
    fetchEvents()
    fetchPlans()
    fetchNotifications()
    
    // Cargar estadísticas del dashboard
    fetchDashboardStats().then(stats => {
      if (stats) {
        setDashboardStats(stats)
      }
    })
  }, [])

  useEffect(() => {
    if (activeView === 'students') {
      fetchAvailableEvents()
      if (studentInfo.email) {
        fetchStudentRegistrations(studentInfo.email)
      }
    }
  }, [activeView, studentInfo.email])

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

  const fetchAvailableEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/available`)
      const result = await response.json()
      
      if (result.status === 'success') {
        setAvailableEvents(result.payload.events || [])
      }
    } catch (error) {
      console.error('Error fetching available events:', error)
    }
  }

  const fetchStudentRegistrations = async (email) => {
    if (!email) return
    try {
      const response = await fetch(`${API_BASE}/students/${email}/registrations`)
      const result = await response.json()
      
      if (result.status === 'success') {
        setStudentRegistrations(result.payload.registrations || [])
      }
    } catch (error) {
      console.error('Error fetching student registrations:', error)
    }
  }

  const registerStudentToEvent = async (eventId) => {
    if (!studentInfo.name || !studentInfo.email || !studentInfo.studentId) {
      alert('Por favor completa toda tu información personal')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_name: studentInfo.name,
          student_email: studentInfo.email,
          student_id: studentInfo.studentId,
          event_id: eventId
        })
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        alert('¡Registro exitoso! Te has inscrito al evento.')
        fetchAvailableEvents()
        fetchStudentRegistrations(studentInfo.email)
        fetchEvents() // Actualizar eventos para reflejar nuevos cupos
      } else {
        alert(result.payload.error || 'Error al registrarse')
      }
    } catch (error) {
      console.error('Error registering student:', error)
      alert('Error al procesar el registro')
    }
  }

  const fetchEventRegistrations = async (eventId) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/registrations`)
      const result = await response.json()
      
      if (result.status === 'success') {
        return result.payload.registrations || []
      }
      return []
    } catch (error) {
      console.error('Error fetching event registrations:', error)
      return []
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`)
      const result = await response.json()
      
      if (result.status === 'success') {
        return result.payload.stats
      }
      return null
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return null
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
                  ? 'border-white-500 text-white bg-white-500/30'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white-500/50 hover:bg-white-500/10'
              }`}
            >
              <HomeIcon className="w-6 h-6" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('events')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'events'
                  ? 'border-white-500 text-white bg-white-500/30'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white-500/50 hover:bg-white-500/10'
              }`}
            >
              <CalendarDaysIcon className="w-6 h-6" />
              <span>Eventos</span>
            </button>
            
            <button
              onClick={() => setActiveView('plans')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'plans'
                   ? 'border-white-500 text-white bg-white-500/30'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white-500/50 hover:bg-white-500/10'
              }`}
            >
              <ClipboardDocumentListIcon className="w-6 h-6" />
              <span>Planificación</span>
            </button>
            
            <button
              onClick={() => setActiveView('notifications')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 relative ${
                activeView === 'notifications'
                   ? 'border-white-500 text-white bg-white-500/30'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white-500/50 hover:bg-white-500/10'
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

            <button
              onClick={() => setActiveView('students')}
              className={`flex items-center space-x-3 px-6 py-4 border-b-4 font-bold text-base transition-all duration-300 ${
                activeView === 'students'
                   ? 'border-white-500 text-white bg-white-500/30'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-white-500/50 hover:bg-white-500/10'
              }`}
            >
              <AcademicCapIcon className="w-6 h-6" />
              <span>Estudiantes</span>
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
            dashboardStats={dashboardStats}
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

        {activeView === 'students' && (
          <StudentsView 
            availableEvents={availableEvents}
            studentRegistrations={studentRegistrations}
            studentInfo={studentInfo}
            setStudentInfo={setStudentInfo}
            onRegisterToEvent={registerStudentToEvent}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}

function DashboardView({ events, plans, notifications, dashboardStats, loading, onCreateEvent, onViewPlans, onViewNotifications }) {
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
      color: 'from-black to-gray-900',
      textColor: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      name: 'Eventos Disponibles',
      value: dashboardStats?.available_events || 0,
      icon: CheckBadgeIcon,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      name: 'Inscripciones Totales',
      value: dashboardStats?.total_registrations || 0,
      icon: UserGroupIcon,
      color: 'from-black to-gray-900',
      textColor: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      name: 'Notificaciones',
      value: totalNotifications,
      icon: BellIcon,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
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
      color: 'from-red-500 to-red-600',
      action: onViewPlans
    },
    {
      name: 'Notificaciones',
      description: 'Revisar actualizaciones',
      icon: BellIcon,
      color: 'from-red-500 to-red-600',
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
  const [eventRegistrations, setEventRegistrations] = useState({})

  useEffect(() => {
    const fetchAllRegistrations = async () => {
      const registrationsData = {}
      for (const event of events) {
        try {
          const response = await fetch(`http://localhost:8000/api/events/${event.event_id}/registrations`)
          const result = await response.json()
          if (result.status === 'success') {
            registrationsData[event.event_id] = result.payload.registrations || []
          }
        } catch (error) {
          console.error(`Error fetching registrations for event ${event.event_id}:`, error)
          registrationsData[event.event_id] = []
        }
      }
      setEventRegistrations(registrationsData)
    }

    if (events.length > 0) {
      fetchAllRegistrations()
    }
  }, [events])
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
        color: 'bg-red-100 text-red-900 border-red-300',
        text: 'Planificando'
      },
      executing: {
        color: 'bg-red-100 text-red-900 border-red-300',
        text: 'En Ejecución'
      },
      completed: {
        color: 'bg-gray-100 text-gray-900 border-gray-300',
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
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-black"
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
                    className="w-full pl-12 pr-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-black"
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
                    className="w-full pl-12 pr-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-black"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Descripción del Evento
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-black"
                  rows="5"
                  placeholder="Describe los objetivos, actividades y detalles del evento..."
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-base font-bold text-gray-900 mb-3">
                  Email del Organizador
                </label>
                <input
                  type="email"
                  value={formData.organizer_email}
                  onChange={(e) => setFormData({...formData, organizer_email: e.target.value})}
                  className="w-full px-5 py-4 border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-semibold text-gray-900 bg-white shadow-black"
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
            <h3 className="mt-6 text-xl font-bold text-gray-900">No hay eventos</h3>
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
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <UsersIcon className="w-4 h-4 mr-2 text-red-500" />
                          Capacidad: {event.expected_attendees}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <BanknotesIcon className="w-4 h-4 mr-2 text-red-500" />
                          ${event.budget.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Cupos Information */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">Cupos Ocupados</span>
                          <span className="text-gray-600">
                            {(eventRegistrations[event.event_id] || []).length} / {event.expected_attendees}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (eventRegistrations[event.event_id] || []).length >= event.expected_attendees
                                ? 'bg-black' 
                                : (eventRegistrations[event.event_id] || []).length > event.expected_attendees * 0.8
                                  ? 'bg-gray-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(((eventRegistrations[event.event_id] || []).length / event.expected_attendees) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Disponibles: {Math.max(0, event.expected_attendees - (eventRegistrations[event.event_id] || []).length)}</span>
                          <span className={
                            (eventRegistrations[event.event_id] || []).length >= event.expected_attendees
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }>
                            {(eventRegistrations[event.event_id] || []).length >= event.expected_attendees ? 'Lleno' : 'Disponible'}
                          </span>
                        </div>
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
  const [planRegistrations, setPlanRegistrations] = useState({})

  useEffect(() => {
    const fetchPlanRegistrations = async () => {
      const registrationsData = {}
      for (const plan of plans) {
        if (plan.event_details?.event_id) {
          try {
            const response = await fetch(`http://localhost:8000/api/events/${plan.event_details.event_id}/registrations`)
            const result = await response.json()
            if (result.status === 'success') {
              registrationsData[plan.event_details.event_id] = result.payload.registrations || []
            }
          } catch (error) {
            console.error(`Error fetching registrations for plan ${plan.plan_id}:`, error)
            registrationsData[plan.event_details.event_id] = []
          }
        }
      }
      setPlanRegistrations(registrationsData)
    }

    if (plans.length > 0) {
      fetchPlanRegistrations()
    }
  }, [plans])
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
        color: 'bg-red-100 text-red-800 border-red-300',
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
                        <h4 className="font-bold text-xl text-gray-900 mb-3 leading-tight">
                          {plan.event_details.event_name}
                        </h4>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${statusConfig.color} shadow-black`}>
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
                      <p className="text-sm text-gray-900 font-medium leading-relaxed">{plan.plan_summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200">
                        <div className="flex items-center text-red-800 font-bold">
                          <ChartBarIcon className="w-4 h-4 mr-2" />
                          {plan.total_tasks}
                        </div>
                        <p className="text-xs text-red-600 font-medium mt-1">Tareas</p>
                      </div>
                      <div className="bg-black/5 rounded-xl p-3 border-2 border-black/20">
                        <div className="flex items-center text-gray-900 font-bold">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          {plan.estimated_duration}
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1">Duración</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                        <div className="flex items-center text-gray-900 font-bold">
                          <UsersIcon className="w-4 h-4 mr-2" />
                          {(planRegistrations[plan.event_details?.event_id] || []).length}/{plan.event_details?.expected_attendees || 0}
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1">Inscritos</p>
                      </div>
                    </div>
                    
                    {/* Cupos Progress Bar */}
                    {plan.event_details?.expected_attendees && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4 border-2 border-gray-200">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">Estado de Inscripciones</span>
                          <span className="text-gray-600">
                            {Math.max(0, plan.event_details.expected_attendees - (planRegistrations[plan.event_details.event_id] || []).length)} cupos disponibles
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (planRegistrations[plan.event_details.event_id] || []).length >= plan.event_details.expected_attendees
                                ? 'bg-black' 
                                : (planRegistrations[plan.event_details.event_id] || []).length > plan.event_details.expected_attendees * 0.8
                                  ? 'bg-gray-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(((planRegistrations[plan.event_details.event_id] || []).length / plan.event_details.expected_attendees) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {(planRegistrations[plan.event_details.event_id] || []).length >= plan.event_details.expected_attendees 
                            ? '🔴 Evento lleno' 
                            : (planRegistrations[plan.event_details.event_id] || []).length > plan.event_details.expected_attendees * 0.8
                              ? '⚫ Pocos cupos' 
                              : '🔴 Cupos disponibles'
                          }
                        </div>
                      </div>
                    )}
                    
                    {plan.status === 'created' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onExecute(plan.plan_id)
                        }}
                        disabled={loading}
                        className="w-full bg-red-gradient text-white px-6 py-4 rounded-xl font-bold text-base hover:shadow-red border-3 border-red-800 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] uppercase tracking-wide"
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
                <h3 className="text-2xl font-bold text-white tracking-tight">Detalles del Plan</h3>
                <p className="text-red-600 text-base mt-2 font-medium">{selectedPlan.event_details.event_name}</p>
              </div>
              
              <div className="p-8">
                <div className="mb-8">
                  <h4 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-4 border-b-2 border-red-600 pb-2">
                    Resumen del Plan
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-6 border-3 border-gray-200">
                    <p className="text-gray-900 font-medium leading-relaxed">{selectedPlan.plan_summary}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-4 border-b-2 border-red-600 pb-2">
                    Tareas del Plan ({selectedPlan.tasks.length})
                  </h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedPlan.tasks.map((task, index) => (
                      <div key={task.task_id} className="bg-white rounded-xl p-6 border-4 border-red-100 shadow-black hover:shadow-black-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <h5 className="font-bold text-lg text-gray-900 leading-tight">
                            {index + 1}. {task.task_name}
                          </h5>
                          <span className={`px-3 py-2 rounded-full text-sm font-bold border-2 ${getPriorityColor(task.priority)} shadow-black uppercase`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
                          <p className="text-sm text-gray-900 font-medium leading-relaxed">{task.description}</p>
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
                      <div className="flex items-center text-white-600 mb-2">
                        <ChartBarIcon className="w-6 h-6 mr-3" />
                        Total de Tareas
                      </div>
                      <p className="text-white-600 font-bold text-3xl">{selectedPlan.total_tasks}</p>
                    </div>
                    <div className="bg-black-gradient rounded-xl p-6 shadow-black-lg border-2 border-black">
                      <div className="flex items-center text-white-600 mb-2">
                        <ClockIcon className="w-6 h-6 mr-3" />
                        Duración Estimada
                      </div>
                      <p className="text-white-600 font-bold text-3xl">{selectedPlan.estimated_duration}</p>
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
              <h3 className="mt-6 text-xl font-bold text-gray-900">Selecciona un Plan</h3>
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
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
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
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        icon: ExclamationTriangleIconSolid
      },
      info: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-900',
        iconColor: 'text-gray-600',
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
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
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

function StudentsView({ availableEvents, studentRegistrations, studentInfo, setStudentInfo, onRegisterToEvent, loading }) {
  const [showInfoForm, setShowInfoForm] = useState(!studentInfo.name)

  const handleInfoSubmit = (e) => {
    e.preventDefault()
    if (studentInfo.name && studentInfo.email && studentInfo.studentId) {
      setShowInfoForm(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-black rounded-3xl p-8 md:p-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center border-2 border-white/30">
              <AcademicCapIcon className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Portal de Estudiantes</h2>
              <p className="text-white/90 mt-2 text-lg">Regístrate a eventos disponibles y gestiona tus inscripciones</p>
            </div>
          </div>
          {studentInfo.name && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
              <div className="text-center">
                <p className="text-white font-medium">{studentInfo.name}</p>
                <p className="text-white/70 text-sm">{studentInfo.studentId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Information Form */}
      {showInfoForm && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
          </div>
          
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={studentInfo.email}
                  onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Estudiante *
                </label>
                <input
                  type="text"
                  required
                  value={studentInfo.studentId}
                  onChange={(e) => setStudentInfo({...studentInfo, studentId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ej: EST2024001"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Guardar Información
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Edit Button */}
      {!showInfoForm && studentInfo.name && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowInfoForm(true)}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Editar información personal
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Available Events */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Eventos Disponibles</h3>
              </div>
              <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-2 rounded-full">
                {availableEvents.filter(e => !e.is_full).length} disponibles
              </span>
            </div>
          </div>

          {availableEvents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-600">Los eventos aparecerán aquí cuando estén disponibles para registro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableEvents.map((event) => (
                <div key={event.event_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{event.event_name}</h4>
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {event.event_type}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{event.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(event.event_date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {event.current_registrations}/{event.expected_attendees} inscritos
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <BanknotesIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Presupuesto: ${event.budget?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Cupos ocupados</span>
                            <span>{event.available_spots} disponibles</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                event.is_full 
                                  ? 'bg-black' 
                                  : event.available_spots < 5 
                                    ? 'bg-gray-500' 
                                    : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${(event.current_registrations / event.expected_attendees) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        {event.is_full ? (
                          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium text-center">
                            <XMarkIcon className="w-5 h-5 mx-auto mb-1" />
                            <span className="block text-sm">Lleno</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onRegisterToEvent(event.event_id)}
                            disabled={loading || !studentInfo.name}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            <CheckBadgeIcon className="w-5 h-5" />
                            <span>Inscribirse</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Registrations */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <CheckBadgeIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mis Inscripciones</h3>
              </div>
              <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-2 rounded-full">
                {studentRegistrations.length}
              </span>
            </div>
          </div>

          {studentRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 text-center py-12">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckBadgeIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Sin inscripciones</h3>
              <p className="text-gray-600 text-sm">Inscríbete a eventos para verlos aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentRegistrations.map((registration) => (
                <div key={registration.registration_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckBadgeIcon className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-gray-900">Evento #{registration.event_id.slice(-8)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Registrado: {new Date(registration.registered_at).toLocaleDateString('es-ES')}</p>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {registration.status}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

