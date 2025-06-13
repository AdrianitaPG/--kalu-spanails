// Configuración de la aplicación Kalu_Spanails
const AppConfig = {
    // Información del spa
    spaInfo: {
        name: "Kalu_Spanails",
        address: "Dirección del spa",
        phone: "+57 300 123 4567",
        email: "info@kaluspanails.com",
        socialMedia: {
            instagram: "@kalu_spanails",
            facebook: "KaluSpanails",
            whatsapp: "+573001234567"
        }
    },

    // Configuración de servicios
    services: {
        semipermanente: {
            name: "Semipermanente",
            duration: 3, // horas
            price: 35000,
            description: "Esmaltado semipermanente que dura hasta 3 semanas",
            icon: "fas fa-paint-brush"
        },
        "esmaltado-tradicional": {
            name: "Esmaltado Tradicional",
            duration: 3,
            price: 20000,
            description: "Esmaltado tradicional con duración de 1 semana",
            icon: "fas fa-hand-sparkles"
        },
        "press-on": {
            name: "Press On",
            duration: 3,
            price: 45000,
            description: "Uñas postizas elegantes y personalizadas",
            icon: "fas fa-gem"
        },
        "base-rubber": {
            name: "Base Rubber",
            duration: 3,
            price: 40000,
            description: "Base resistente y duradera para mayor duración",
            icon: "fas fa-layer-group"
        }
    },

    // Configuración de horarios
    schedule: {
        openTime: 7,  // 7 AM
        closeTime: 20, // 8 PM
        serviceDuration: 3, // horas por servicio
        timeSlots: [
            '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
            '19:00', '20:00'
        ],
        daysOff: [], // Días de la semana cerrados (0 = domingo, 1 = lunes, etc.)
        holidays: [] // Fechas específicas cerradas (formato: 'YYYY-MM-DD')
    },

    // Configuración de la aplicación
    app: {
        maxDaysInAdvance: 30, // Máximo días para agendar con anticipación
        minHoursInAdvance: 2, // Mínimo horas de anticipación para agendar
        autoCleanOldAppointments: true,
        cleanupDays: 30, // Días después de los cuales limpiar citas antiguas
        theme: {
            primaryColor: '#ff6b6b',
            secondaryColor: '#ee5a24',
            successColor: '#00b894',
            backgroundColor: '#667eea'
        }
    },

    // Mensajes de la aplicación
    messages: {
        success: {
            appointmentBooked: "¡Tu cita ha sido agendada exitosamente!",
            appointmentCanceled: "Tu cita ha sido cancelada."
        },
        errors: {
            invalidName: "Por favor ingresa un nombre válido",
            invalidPhone: "Por favor ingresa un número de teléfono válido",
            timeSlotTaken: "Este horario ya está ocupado",
            pastTime: "No puedes agendar citas en horarios pasados",
            noService: "Por favor selecciona un servicio",
            noDate: "Por favor selecciona una fecha",
            noTime: "Por favor selecciona un horario",
            networkError: "Error de conexión. Por favor intenta nuevamente."
        },
        info: {
            serviceDuration: "Todos nuestros servicios tienen una duración de 3 horas",
            advanceBooking: "Puedes agendar con hasta 30 días de anticipación",
            cancellation: "Para cancelar tu cita, contáctanos directamente"
        }
    },

    // Validaciones
    validation: {
        name: {
            minLength: 2,
            maxLength: 50,
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/
        },
        phone: {
            minLength: 10,
            maxLength: 15,
            regex: /^[\d\s\-\+\(\)]{10,15}$/
        }
    },

    // Configuración de almacenamiento
    storage: {
        appointmentsKey: 'kaluSpanailsAppointments',
        userPreferencesKey: 'kaluSpanailsPreferences',
        enableLocalStorage: true
    }
};

// Funciones de utilidad para la configuración
const ConfigUtils = {
    // Obtener información de un servicio
    getServiceInfo: (serviceType) => {
        return AppConfig.services[serviceType] || null;
    },

    // Verificar si un día está disponible
    isDayAvailable: (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        // Verificar días de la semana cerrados
        if (AppConfig.schedule.daysOff.includes(dayOfWeek)) {
            return false;
        }

        // Verificar días festivos específicos
        const dateString = date.toString();
        if (AppConfig.schedule.holidays.includes(dateString)) {
            return false;
        }

        return true;
    },

    // Formatear precio
    formatPrice: (price) => {
        return `$${Number(price).toLocaleString('es-CO')}`;
    },

    // Obtener horarios disponibles para una fecha
    getAvailableTimeSlots: (date) => {
        if (!ConfigUtils.isDayAvailable(date)) {
            return [];
        }

        const today = new Date();
        const selectedDate = new Date(date);
        const isToday = selectedDate.toDateString() === today.toDateString();

        return AppConfig.schedule.timeSlots.filter(time => {
            if (isToday) {
                const timeHour = parseInt(time.split(':')[0]);
                const currentHour = today.getHours();
                const minAdvanceHours = AppConfig.app.minHoursInAdvance;

                return timeHour >= (currentHour + minAdvanceHours);
            }
            return true;
        });
    },

    // Validar fecha máxima de agendamiento
    isDateWithinRange: (date) => {
        const today = new Date();
        const selectedDate = new Date(date);
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + AppConfig.app.maxDaysInAdvance);

        return selectedDate >= today && selectedDate <= maxDate;
    },

    // Obtener configuración de tema
    getThemeColors: () => {
        return AppConfig.app.theme;
    }
};

// Exportar configuración (si se usa como módulo)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, ConfigUtils };
}