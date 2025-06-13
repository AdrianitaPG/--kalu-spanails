// Variables globales
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let appointments = []; // Array para almacenar las citas reservadas

// Elementos del DOM
const servicesSection = document.getElementById('servicesSection');
const bookingSection = document.getElementById('bookingSection');
const serviceCards = document.querySelectorAll('.service-card');
const backBtn = document.getElementById('backBtn');
const dateInput = document.getElementById('dateInput');
const timeGrid = document.getElementById('timeGrid');
const clientForm = document.getElementById('clientForm');
const confirmBtn = document.getElementById('confirmBtn');
const modal = document.getElementById('confirmationModal');
const newAppointmentBtn = document.getElementById('newAppointmentBtn');

// Horarios disponibles (7 AM a 8 PM)
const availableHours = [
    '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00'
];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar fecha mínima (hoy)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    dateInput.min = todayString;
    dateInput.value = todayString;

    // Event listeners
    setupEventListeners();

    // Cargar citas existentes del almacenamiento local si existen
    loadAppointments();
}

function setupEventListeners() {
    // Selección de servicios
    serviceCards.forEach(card => {
        card.addEventListener('click', () => selectService(card));
    });

    // Botón de retroceso
    backBtn.addEventListener('click', goBackToServices);

    // Cambio de fecha
    dateInput.addEventListener('change', generateTimeSlots);

    // Botón de confirmación
    confirmBtn.addEventListener('click', confirmAppointment);

    // Nuevo turno
    newAppointmentBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        goBackToServices();
    });

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            goBackToServices();
        }
    });
}

function selectService(card) {
    // Remover selección anterior
    serviceCards.forEach(c => c.classList.remove('selected'));

    // Seleccionar nueva tarjeta
    card.classList.add('selected');

    // Guardar datos del servicio
    selectedService = {
        name: card.querySelector('h3').textContent,
        price: card.dataset.price,
        type: card.dataset.service
    };

    // Mostrar sección de reserva
    setTimeout(() => {
        showBookingSection();
    }, 300);
}

function showBookingSection() {
    servicesSection.style.display = 'none';
    bookingSection.style.display = 'block';

    // Actualizar información del servicio seleccionado
    document.getElementById('selectedServiceName').textContent = selectedService.name;
    document.getElementById('selectedServicePrice').textContent = `$${Number(selectedService.price).toLocaleString()}`;

    // Generar horarios para la fecha seleccionada
    generateTimeSlots();
}

function goBackToServices() {
    bookingSection.style.display = 'none';
    servicesSection.style.display = 'block';

    // Limpiar selecciones
    selectedService = null;
    selectedDate = null;
    selectedTime = null;

    // Limpiar formulario
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    clientForm.style.display = 'none';

    // Remover selección de tarjetas
    serviceCards.forEach(card => card.classList.remove('selected'));
}


function generateTimeSlots() {
    const selectedDateValue = dateInput.value;
    if (!selectedDateValue) return;

    // Crear fecha con la zona horaria local
    const localDate = new Date(selectedDateValue + 'T00:00:00');
    selectedDate = localDate.toISOString().split('T')[0];
    timeGrid.innerHTML = '';

    const currentDate = new Date();
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const isToday = selectedDateObj.toDateString() === currentDate.toDateString();
    const currentHour = currentDate.getHours();

    availableHours.forEach(hour => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = formatTime(hour);
        timeSlot.dataset.time = hour;

        // Verificar si el horario ya está ocupado
        const isOccupied = isTimeSlotOccupied(selectedDate, hour);

        // Verificar si es hora pasada (solo para hoy)
        const hourNumber = parseInt(hour.split(':')[0]);
        const isPastHour = isToday && hourNumber <= currentHour;

        if (isOccupied || isPastHour) {
            timeSlot.classList.add('occupied');
            timeSlot.textContent += ' - Ocupado';
        } else {
            timeSlot.addEventListener('click', () => selectTimeSlot(timeSlot));
        }

        timeGrid.appendChild(timeSlot);
    });
}

function formatTime(time) {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);

    if (hourNum === 12) {
        return `${hour}:${minute} PM`;
    } else if (hourNum > 12) {
        return `${hourNum - 12}:${minute} PM`;
    } else {
        return `${hour}:${minute} AM`;
    }
}

function isTimeSlotOccupied(date, startTime) {
    const startHour = parseInt(startTime.split(':')[0]);

    // Verificar si alguna cita existente se superpone con este horario
    return appointments.some(appointment => {
        if (appointment.date !== date) return false;

        const appointmentStart = parseInt(appointment.time.split(':')[0]);
        const appointmentEnd = appointmentStart + 3; // Duración de 3 horas

        // Verificar superposición
        return (startHour >= appointmentStart && startHour < appointmentEnd) ||
            (startHour < appointmentStart && startHour + 3 > appointmentStart);
    });
}

function selectTimeSlot(slot) {
    if (slot.classList.contains('occupied')) return;

    // Remover selección anterior
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));

    // Seleccionar nuevo horario
    slot.classList.add('selected');
    selectedTime = slot.dataset.time;

    // Mostrar formulario del cliente
    showClientForm();
}

function showClientForm() {
    clientForm.style.display = 'block';

    // Actualizar detalles de la cita
    const localDate = new Date(selectedDate + 'T00:00:00');
    const formattedDate = localDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('selectedDate').textContent = formattedDate;
    document.getElementById('selectedTime').textContent = formatTime(selectedTime);

    // Scroll hacia el formulario
    clientForm.scrollIntoView({ behavior: 'smooth' });
}


function confirmAppointment() {
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();

    // Validar campos
    if (!clientName || !clientPhone) {
        alert('Por favor completa todos los campos');
        return;
    }

    // Validar teléfono (debe tener al menos 10 dígitos)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(clientPhone)) {
        alert('Por favor ingresa un número de teléfono válido');
        return;
    }

    // Asegurarse de que la fecha esté en la zona horaria local
    const localDate = new Date(selectedDate + 'T00:00:00');
    const appointmentDate = localDate.toISOString().split('T')[0];

    // Crear nueva cita
    const newAppointment = {
        id: Date.now(),
        clientName: clientName,
        clientPhone: clientPhone,
        service: selectedService,
        date: appointmentDate,  // Usar la fecha ajustada
        time: selectedTime,
        duration: 3,
        timestamp: new Date().toISOString()
    };

    // Agregar cita al array
    appointments.push(newAppointment);

    // Guardar en almacenamiento local
    saveAppointments();

    // Mostrar modal de confirmación
    showConfirmationModal(newAppointment);
}

function showConfirmationModal(appointment) {
    // Llenar datos del modal
    document.getElementById('modalClientName').textContent = appointment.clientName;
    document.getElementById('modalClientPhone').textContent = appointment.clientPhone;
    document.getElementById('modalService').textContent = appointment.service.name;

    const dateObj = new Date(appointment.date);
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('modalDate').textContent = formattedDate;
    document.getElementById('modalTime').textContent = formatTime(appointment.time);
    document.getElementById('modalPrice').textContent = `${Number(appointment.service.price).toLocaleString()}`;

    // Mostrar modal
    modal.style.display = 'block';
}

function saveAppointments() {
    // En un entorno real, esto se enviaría a un servidor
    // Por ahora, simulamos el guardado en memoria
    console.log('Cita guardada:', appointments[appointments.length - 1]);

    // Opcional: guardar en localStorage para persistencia local
    try {
        localStorage.setItem('kaluSpanailsAppointments', JSON.stringify(appointments));
    } catch (e) {
        console.log('No se pudo guardar en localStorage');
    }
}

function loadAppointments() {
    // Cargar citas existentes
    try {
        const savedAppointments = localStorage.getItem('kaluSpanailsAppointments');
        if (savedAppointments) {
            appointments = JSON.parse(savedAppointments);

            // Limpiar citas antiguas (más de 30 días)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            appointments = appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.date);
                return appointmentDate >= thirtyDaysAgo;
            });

            // Guardar la lista limpia
            saveAppointments();
        }
    } catch (e) {
        console.log('No se pudieron cargar las citas guardadas');
        appointments = [];
    }
}

// Función para obtener el horario de finalización de una cita
function getEndTime(startTime, duration) {
    const [hour, minute] = startTime.split(':');
    const startHour = parseInt(hour);
    const endHour = startHour + duration;

    return `${endHour}:${minute}`;
}

// Función para validar superposición de horarios
function hasTimeConflict(date, startTime, duration, excludeId = null) {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = startHour + duration;

    return appointments.some(appointment => {
        if (excludeId && appointment.id === excludeId) return false;
        if (appointment.date !== date) return false;

        const appointmentStart = parseInt(appointment.time.split(':')[0]);
        const appointmentEnd = appointmentStart + appointment.duration;

        // Verificar si hay superposición
        return (startHour < appointmentEnd && endHour > appointmentStart);
    });
}

// Función para formatear fecha en español
function formatDateInSpanish(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return date.toLocaleDateString('es-ES', options);
}

// Función para obtener estadísticas de citas (útil para futuras mejoras)
function getAppointmentStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(app => app.date === today);

    return {
        total: appointments.length,
        today: todayAppointments.length,
        services: appointments.reduce((acc, app) => {
            acc[app.service.type] = (acc[app.service.type] || 0) + 1;
            return acc;
        }, {})
    };
}

// Función para limpiar formularios
function clearForms() {
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';

    // Limpiar selecciones de tiempo
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Ocultar formulario del cliente
    clientForm.style.display = 'none';

    // Resetear variables de selección
    selectedTime = null;
}

// Función para manejar errores de red (para futuras implementaciones)
function handleNetworkError(error) {
    console.error('Error de red:', error);
    alert('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
}

// Funciones de utilidad para validación
function validateName(name) {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    return nameRegex.test(name.trim());
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    return phoneRegex.test(phone.trim());
}

// Event listener para el scroll suave en dispositivos móviles
function smoothScrollToElement(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Función para detectar si es dispositivo móvil
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Optimización para dispositivos móviles
if (isMobileDevice()) {
    // Agregar clase para estilos específicos de móvil
    document.body.classList.add('mobile-device');

    // Prevenir zoom al hacer focus en inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (this.type !== 'date') {
                this.style.fontSize = '16px';
            }
        });
    });
}

// Inicialización adicional cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Agregar animaciones de entrada
    setTimeout(() => {
        document.querySelector('.header').style.opacity = '1';
        document.querySelector('.services-section').style.opacity = '1';
    }, 100);

    // Configurar eventos de teclado para navegación
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            } else if (bookingSection.style.display === 'block') {
                goBackToServices();
            }
        }
    });
});

// Función para exportar citas (útil para el administrador)
function exportAppointments() {
    const dataStr = JSON.stringify(appointments, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `kalu_spanails_citas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Console log para debugging (remover en producción)
console.log('Kalu_Spanails App initialized successfully');

// Función para mostrar todas las citas del día (útil para el spa)
function getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appointment => appointment.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));
}

// Función para compartir la aplicación
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Kalu_Spanails',
            text: '¡Agenda tu cita en Kalu_Spanails!',
            url: window.location.href
        }).then(() => {
            console.log('Compartido exitosamente');
        }).catch(console.error);
    } else {
        // Fallback para navegadores que no soportan Web Share API
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert('¡Link copiado al portapapeles!');
    }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado');
            })
            .catch(error => {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}