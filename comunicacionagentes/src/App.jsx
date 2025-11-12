import { useState } from 'react'
import OrganizerDashboard from './components/OrganizerDashboard'
import StudentPortal from './components/StudentPortal'

function App() {
  const [currentView, setCurrentView] = useState('organizer')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header profesional */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EventOS</h1>
                <p className="text-sm text-gray-600">Sistema Multi-Agente Universitario</p>
              </div>
            </div>

            {/* Navegación mejorada */}
            <nav className="flex items-center space-x-2">
              <div className="bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setCurrentView('organizer')}
                  className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                    currentView === 'organizer'
                      ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Organizador</span>
                  {currentView === 'organizer' && (
                    <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setCurrentView('student')}
                  className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                    currentView === 'student'
                      ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Estudiante</span>
                  {currentView === 'student' && (
                    <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </button>
              </div>
              
              {/* Badge de estado del sistema */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Sistema Activo</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {currentView === 'organizer' ? <OrganizerDashboard /> : <StudentPortal />}
      </main>

      {/* Footer mejorado */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Información del sistema */}
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">EventOS</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Sistema Multi-Agente para gestión inteligente de eventos universitarios. 
                Integrando IA conversacional con protocolos AG-UI para una experiencia optimizada.
              </p>
            </div>

            {/* Características */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Características</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Planificación automática con IA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Comunicación en tiempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Protocolo AG-UI</span>
                </li>
              </ul>
            </div>

            {/* Estado técnico */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Estado del Sistema</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frontend</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Activo</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Agente Planificador</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-600">Procesando</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WebSocket</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">Conectado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Línea separadora y copyright */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">
                © 2025 EventOS. Powered by React + Vite + Tailwind CSS
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-xs text-gray-400">v1.0.0</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">Multi-Agent Architecture</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">AG-UI Protocol</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
