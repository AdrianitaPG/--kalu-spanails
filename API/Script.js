// Configuración de Supabase
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUÍ';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUÍ';

// Inicializar cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function initializeApp() {
    // Configurar fecha mínima (hoy)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    dateInput.min = todayString;
    dateInput.value = todayString;

    // Event listeners
    setupEventListeners();

    // Cargar citas existentes desde Supabase
    await loadAppointments();
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

// FUNCIÓN MODIFICADA: Confirmar cita con Supabase
async function confirmAppointment() {
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

    // Deshabilitar botón durante el proceso
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Agendando...';

    try {
        // Asegurarse de que la fecha esté en la zona horaria local
        const localDate = new Date(selectedDate + 'T00:00:00');
        const appointmentDate = localDate.toISOString().split('T')[0];

        // Crear nueva cita para Supabase
        const newAppointment = {
            client_name: clientName,
            client_phone: clientPhone,
            service_name: selectedService.name,
            service_price: parseFloat(selectedService.price),
            date: appointmentDate,
            time: selectedTime,
            status: 'pending'
        };

        // Guardar en Supabase
        const { data, error } = await supabase
            .from('appointments')
            .insert([newAppointment])
            .select()
            .single();

        if (error) {
            console.error('Error al guardar cita:', error);
            alert('Error al agendar la cita. Por favor intenta nuevamente.');
            return;
        }

        // Agregar al array local para actualizar la UI
        appointments.push({
            id: data.id,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            service: {
                name: data.service_name,
                price: data.service_price
            },
            date: data.date,
            time: data.time,
            status: data.status
        });

        // Mostrar modal de confirmación
        showConfirmationModal({
            clientName: data.client_name,
            clientPhone: data.client_phone,
            service: {
                name: data.service_name,
                price: data.service_price
            },
            date: data.date,
            time: data.time
        });

    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error de conexión. Por favor verifica tu internet e intenta nuevamente.');
    } finally {
        // Rehabilitar botón
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar Cita';
    }
}

function showConfirmationModal(appointment) {
    // Llenar datos del modal
    document.getElementById('modalClientName').textContent = appointment.clientName;
    document.getElementById('modalClientPhone').textContent = appointment.clientPhone;
    document.getElementById('modalService').textContent = appointment.service.name;

    const dateObj = new Date(appointment.date + 'T00:00:00');
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

// FUNCIÓN MODIFICADA: Cargar citas desde Supabase
async function loadAppointments() {
    try {
        // Obtener fecha de hace 30 días para limpiar citas antiguas
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .gte('date', cutoffDate)
            .neq('status', 'cancelled');

        if (error) {
            console.error('Error al cargar citas:', error);
            // Fallback a localStorage si hay error
            loadAppointmentsFromLocalStorage();
            return;
        }

        // Convertir formato de Supabase al formato usado en la app
        appointments = data.map(appointment => ({
            id: appointment.id,
            clientName: appointment.client_name,
            clientPhone: appointment.client_phone,
            service: {
                name: appointment.service_name,
                price: appointment.service_price,
                type: appointment.service_name.toLowerCase()
            },
            date: appointment.date,
            time: appointment.time,
            duration: 3,
            timestamp: appointment.created_at,
            status: appointment.status
        }));

        console.log(`Cargadas ${appointments.length} citas desde Supabase`);

    } catch (error) {
        console.error('Error de conexión:', error);
        // Fallback a localStorage si no hay conexión
        loadAppointmentsFromLocalStorage();
    }
}

// Función de respaldo para localStorage
function loadAppointmentsFromLocalStorage() {
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

            console.log(`Cargadas ${appointments.length} citas desde localStorage (respaldo)`);
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
    const date = new Date(dateString + 'T00:00:00');
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
            const serviceType = app.service.type || app.service.name.toLowerCase();
            acc[serviceType] = (acc[serviceType] || 0) + 1;
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
        const header = document.querySelector('.header');
        const servicesSection = document.querySelector('.services-section');
        if (header) header.style.opacity = '1';
        if (servicesSection) servicesSection.style.opacity = '1';
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