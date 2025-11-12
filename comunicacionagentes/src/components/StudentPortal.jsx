import { useState, useEffect } from 'react';
import eventService from '../services/eventService';

function StudentPortal() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [studentData, setStudentData] = useState({
    studentId: '',
    name: '',
    email: '',
    program: ''
  });
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: '',
    studentName: '',
    studentEmail: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, categoryFilter]);

  const loadEvents = () => {
    const allEvents = eventService.getEvents();
    // Mostrar solo eventos aprobados o en planificación
    const availableEvents = allEvents.filter(
      event => event.status === 'approved' || event.status === 'planning'
    );
    setEvents(availableEvents);
  };

  const filterEvents = () => {
    let filtered = events;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleRegister = (event) => {
    setSelectedEvent(event);
    setShowRegistrationForm(true);
  };

  const submitRegistration = (e) => {
    e.preventDefault();
    
    if (selectedEvent) {
      eventService.registerStudent(selectedEvent.id, studentData);
      alert('¡Registro exitoso! Te esperamos en el evento.');
      
      // Resetear formulario
      setStudentData({
        studentId: '',
        name: '',
        email: '',
        program: ''
      });
      setShowRegistrationForm(false);
      setSelectedEvent(null);
      loadEvents();
    }
  };

  const handleLeaveFeedback = (event) => {
    setSelectedEvent(event);
    setShowFeedbackForm(true);
  };

  const submitFeedback = (e) => {
    e.preventDefault();
    
    if (selectedEvent) {
      eventService.addFeedback({
        ...feedbackData,
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title
      });
      alert('¡Gracias por tu feedback!');
      
      // Resetear formulario
      setFeedbackData({
        rating: 5,
        comment: '',
        studentName: '',
        studentEmail: ''
      });
      setShowFeedbackForm(false);
      setSelectedEvent(null);
    }
  };

  const isEventFull = (event) => {
    return event.registrations >= event.capacity;
  };

  const isEventPast = (event) => {
    return new Date(event.date) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 px-8 py-12 shadow-2xl">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h1 className="text-4xl font-bold text-white mb-3">
                Portal de Estudiantes
              </h1>
              <p className="text-purple-100 text-lg max-w-2xl">
                Descubre eventos universitarios únicos y enriquece tu experiencia académica
              </p>
              <div className="flex items-center space-x-4 mt-6">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Explora Eventos</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Red Estudiantil</span>
                </div>
              </div>
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
          </div>
        </div>

        {/* Buscador y filtros mejorados */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Buscar Eventos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por título, descripción o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12 text-lg py-4"
                />
              </div>
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filtrar por Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input py-4 text-lg"
              >
                <option value="all">Todas las categorías</option>
                <option value="Académico">Académico</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Cultural">Cultural</option>
                <option value="Deportivo">Deportivo</option>
                <option value="Social">Social</option>
              </select>
            </div>
          </div>
          
          {/* Estadísticas de búsqueda */}
          {searchTerm || categoryFilter !== 'all' ? (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-purple-600">{filteredEvents.length}</span> eventos encontrados
                {searchTerm && ` para "${searchTerm}"`}
                {categoryFilter !== 'all' && ` en categoría "${categoryFilter}"`}
              </p>
            </div>
          ) : null}
        </div>

        {/* Grid de eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              onFeedback={handleLeaveFeedback}
              isFull={isEventFull(event)}
              isPast={isEventPast(event)}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron eventos
            </h3>
            <p className="text-gray-500">
              Intenta con otros términos de búsqueda o filtros
            </p>
          </div>
        )}

        {/* Modal de registro */}
        {showRegistrationForm && selectedEvent && (
          <Modal
            title={`Registrarse en: ${selectedEvent.title}`}
            onClose={() => {
              setShowRegistrationForm(false);
              setSelectedEvent(null);
            }}
          >
            <form onSubmit={submitRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Estudiante
                </label>
                <input
                  type="text"
                  required
                  value={studentData.studentId}
                  onChange={(e) => setStudentData({...studentData, studentId: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={studentData.name}
                  onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={studentData.email}
                  onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programa Académico
                </label>
                <input
                  type="text"
                  required
                  value={studentData.program}
                  onChange={(e) => setStudentData({...studentData, program: e.target.value})}
                  className="input"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 px-6 py-3"
                >
                  Confirmar Registro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setSelectedEvent(null);
                  }}
                  className="btn btn-secondary flex-1 px-6 py-3"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal de feedback */}
        {showFeedbackForm && selectedEvent && (
          <Modal
            title={`Feedback: ${selectedEvent.title}`}
            onClose={() => {
              setShowFeedbackForm(false);
              setSelectedEvent(null);
            }}
          >
            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  value={feedbackData.studentName}
                  onChange={(e) => setFeedbackData({...feedbackData, studentName: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu Email
                </label>
                <input
                  type="email"
                  required
                  value={feedbackData.studentEmail}
                  onChange={(e) => setFeedbackData({...feedbackData, studentEmail: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData({...feedbackData, rating: star})}
                      className={`text-3xl transition hover:scale-110 ${
                        star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {feedbackData.rating} de 5 estrellas
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios
                </label>
                <textarea
                  required
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({...feedbackData, comment: e.target.value})}
                  className="input"
                  rows="4"
                  placeholder="Cuéntanos tu experiencia..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition font-medium shadow-sm"
                >
                  Enviar Feedback
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setSelectedEvent(null);
                  }}
                  className="btn btn-secondary flex-1 px-6 py-3"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de evento
function EventCard({ event, onRegister, onFeedback, isFull, isPast }) {
  const categoryColors = {
    'Académico': 'bg-blue-50 text-blue-700 border-blue-200',
    'Tecnología': 'bg-purple-50 text-purple-700 border-purple-200',
    'Cultural': 'bg-pink-50 text-pink-700 border-pink-200',
    'Deportivo': 'bg-green-50 text-green-700 border-green-200',
    'Social': 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };

  const categoryIcons = {
    'Académico': (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'Tecnología': (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'Cultural': (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    'Deportivo': (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
    'Social': (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`h-40 p-8 flex items-center justify-center border-b ${categoryColors[event.category]}`}>
        <div className="w-20 h-20 text-current opacity-80">
          {categoryIcons[event.category] || categoryIcons['Social']}
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-gray-900 flex-1">{event.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[event.category]}`}>
            {event.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2.5 text-sm text-gray-700 mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-700">{new Date(event.date).toLocaleDateString('es-ES', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">{event.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-700 truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-gray-700">{event.registrations}/{event.capacity} inscritos</span>
            {isFull && <span className="text-red-600 font-semibold text-xs">(Lleno)</span>}
          </div>
        </div>

        {/* Barra de progreso de capacidad */}
        <div className="mb-5">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isFull ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((event.registrations / event.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!isPast && !isFull && (
            <button
              onClick={() => onRegister(event)}
              className="btn btn-primary flex-1 text-sm py-2.5"
            >
              Registrarme
            </button>
          )}
          {isPast && (
            <button
              onClick={() => onFeedback(event)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl transition text-sm font-medium shadow-sm py-2.5"
            >
              Dejar Feedback
            </button>
          )}
          {isFull && !isPast && (
            <div className="flex-1 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium text-center py-2.5 border border-gray-200">
              Cupo Lleno
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Modal
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default StudentPortal;
