/**
 * Servicio para gestión de eventos
 */

class EventService {
  constructor() {
    this.events = this.loadEvents();
    this.registrations = this.loadRegistrations();
    this.feedback = this.loadFeedback();
  }

  // ========== Gestión de Eventos ==========

  /**
   * Obtener todos los eventos
   */
  getEvents() {
    return this.events;
  }

  /**
   * Obtener evento por ID
   */
  getEvent(eventId) {
    return this.events.find(event => event.id === eventId);
  }

  /**
   * Crear nuevo evento
   */
  createEvent(eventData) {
    const newEvent = {
      id: `event-${Date.now()}`,
      ...eventData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registrations: 0,
      tasks: []
    };

    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  /**
   * Actualizar evento
   */
  updateEvent(eventId, updates) {
    const index = this.events.findIndex(event => event.id === eventId);
    if (index !== -1) {
      this.events[index] = {
        ...this.events[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveEvents();
      return this.events[index];
    }
    return null;
  }

  /**
   * Eliminar evento
   */
  deleteEvent(eventId) {
    const index = this.events.findIndex(event => event.id === eventId);
    if (index !== -1) {
      this.events.splice(index, 1);
      this.saveEvents();
      return true;
    }
    return false;
  }

  /**
   * Actualizar tareas de planificación del evento
   */
  updateEventTasks(eventId, tasks) {
    const event = this.getEvent(eventId);
    if (event) {
      event.tasks = tasks;
      event.updatedAt = new Date().toISOString();
      this.saveEvents();
      return event;
    }
    return null;
  }

  // ========== Registro de Estudiantes ==========

  /**
   * Registrar estudiante a un evento
   */
  registerStudent(eventId, studentData) {
    const registration = {
      id: `reg-${Date.now()}`,
      eventId,
      studentId: studentData.studentId,
      name: studentData.name,
      email: studentData.email,
      program: studentData.program,
      registeredAt: new Date().toISOString(),
      status: 'confirmed'
    };

    this.registrations.push(registration);
    
    // Actualizar contador de registros del evento
    const event = this.getEvent(eventId);
    if (event) {
      event.registrations = (event.registrations || 0) + 1;
      this.saveEvents();
    }
    
    this.saveRegistrations();
    return registration;
  }

  /**
   * Obtener registros de un evento
   */
  getEventRegistrations(eventId) {
    return this.registrations.filter(reg => reg.eventId === eventId);
  }

  /**
   * Obtener registros de un estudiante
   */
  getStudentRegistrations(studentId) {
    return this.registrations.filter(reg => reg.studentId === studentId);
  }

  /**
   * Cancelar registro
   */
  cancelRegistration(registrationId) {
    const index = this.registrations.findIndex(reg => reg.id === registrationId);
    if (index !== -1) {
      const registration = this.registrations[index];
      this.registrations.splice(index, 1);
      
      // Actualizar contador del evento
      const event = this.getEvent(registration.eventId);
      if (event && event.registrations > 0) {
        event.registrations--;
        this.saveEvents();
      }
      
      this.saveRegistrations();
      return true;
    }
    return false;
  }

  // ========== Feedback ==========

  /**
   * Agregar feedback de estudiante
   */
  addFeedback(feedbackData) {
    const newFeedback = {
      id: `feedback-${Date.now()}`,
      ...feedbackData,
      createdAt: new Date().toISOString()
    };

    this.feedback.push(newFeedback);
    this.saveFeedback();
    return newFeedback;
  }

  /**
   * Obtener feedback de un evento
   */
  getEventFeedback(eventId) {
    return this.feedback.filter(fb => fb.eventId === eventId);
  }

  /**
   * Obtener todo el feedback
   */
  getAllFeedback() {
    return this.feedback;
  }

  // ========== Estadísticas ==========

  /**
   * Obtener estadísticas generales
   */
  getStats() {
    const now = new Date();
    const upcomingEvents = this.events.filter(event => 
      new Date(event.date) > now && event.status !== 'cancelled'
    );
    const pastEvents = this.events.filter(event => 
      new Date(event.date) <= now || event.status === 'completed'
    );
    const totalRegistrations = this.registrations.length;
    const avgRating = this.feedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / 
                     (this.feedback.length || 1);

    return {
      totalEvents: this.events.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      totalRegistrations,
      totalFeedback: this.feedback.length,
      averageRating: avgRating.toFixed(1)
    };
  }

  // ========== Persistencia ==========

  loadEvents() {
    try {
      const saved = localStorage.getItem('events');
      return saved ? JSON.parse(saved) : this.getDefaultEvents();
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      return this.getDefaultEvents();
    }
  }

  saveEvents() {
    try {
      localStorage.setItem('events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Error al guardar eventos:', error);
    }
  }

  loadRegistrations() {
    try {
      const saved = localStorage.getItem('registrations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error al cargar registros:', error);
      return [];
    }
  }

  saveRegistrations() {
    try {
      localStorage.setItem('registrations', JSON.stringify(this.registrations));
    } catch (error) {
      console.error('Error al guardar registros:', error);
    }
  }

  loadFeedback() {
    try {
      const saved = localStorage.getItem('feedback');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error al cargar feedback:', error);
      return [];
    }
  }

  saveFeedback() {
    try {
      localStorage.setItem('feedback', JSON.stringify(this.feedback));
    } catch (error) {
      console.error('Error al guardar feedback:', error);
    }
  }

  getDefaultEvents() {
    return [
      {
        id: 'event-1',
        title: 'Feria de Ciencias 2025',
        description: 'Exhibición de proyectos científicos y tecnológicos de estudiantes.',
        date: '2025-12-15',
        time: '09:00',
        location: 'Auditorio Principal',
        capacity: 200,
        registrations: 45,
        category: 'Académico',
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: []
      },
      {
        id: 'event-2',
        title: 'Hackathon Universitario',
        description: '48 horas de programación intensiva para resolver desafíos reales.',
        date: '2025-11-25',
        time: '08:00',
        location: 'Laboratorio de Computación',
        capacity: 100,
        registrations: 78,
        category: 'Tecnología',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: []
      }
    ];
  }
}

const eventService = new EventService();
export default eventService;
