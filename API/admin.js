// Variables globales
let appointments = [];
let currentEditingAppointment = null;

// Elementos del DOM
const filterDate = document.getElementById('filterDate');
const filterStatus = document.getElementById('filterStatus');
const appointmentsList = document.getElementById('appointmentsList');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadAppointments();
    setupEventListeners();
    updateAppointmentsList();
});

function setupEventListeners() {
    // Filtros
    filterDate.addEventListener('change', updateAppointmentsList);
    filterStatus.addEventListener('change', updateAppointmentsList);

    // Botón de actualizar
    document.getElementById('refreshButton').addEventListener('click', () => {
        loadAppointments();
        updateAppointmentsList();
    });

    // Formulario de edición
    editForm.addEventListener('submit', handleEditSubmit);

    // Botón de cerrar modal
    document.querySelector('.close-btn').addEventListener('click', closeEditModal);

    // Botón de eliminar
    document.querySelector('.delete-btn').addEventListener('click', handleDelete);
}

function loadAppointments() {
    const saved = localStorage.getItem('kaluSpanailsAppointments');
    appointments = saved ? JSON.parse(saved) : [];
}

function updateAppointmentsList() {
    const dateFilter = filterDate.value;
    const statusFilter = filterStatus.value;

    let filteredAppointments = appointments;

    // Aplicar filtros
    if (dateFilter) {
        filteredAppointments = filteredAppointments.filter(app => app.date === dateFilter);
    }

    if (statusFilter !== 'all') {
        filteredAppointments = filteredAppointments.filter(app => app.status === statusFilter);
    }

    // Ordenar por fecha y hora
    filteredAppointments.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare || a.time.localeCompare(b.time);
    });

    // Renderizar lista
    appointmentsList.innerHTML = filteredAppointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <span class="appointment-status status-${appointment.status || 'pending'}">
                    ${getStatusText(appointment.status || 'pending')}
                </span>
                <button onclick="openEditModal(${appointment.id})" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <h3>${appointment.clientName}</h3>
            <p><i class="fas fa-phone"></i> ${appointment.clientPhone}</p>
            <p><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</p>
            <p><i class="fas fa-clock"></i> ${formatTime(appointment.time)}</p>
            <p><i class="fas fa-spa"></i> ${appointment.service.name}</p>
            <p><i class="fas fa-tag"></i> $${Number(appointment.service.price).toLocaleString()}</p>
        </div>
    `).join('');
}

function openEditModal(appointmentId) {
    currentEditingAppointment = appointments.find(app => app.id === appointmentId);
    if (!currentEditingAppointment) return;

    // Llenar el formulario
    document.getElementById('editName').value = currentEditingAppointment.clientName;
    document.getElementById('editPhone').value = currentEditingAppointment.clientPhone;
    document.getElementById('editDate').value = currentEditingAppointment.date;
    document.getElementById('editTime').value = currentEditingAppointment.time;
    document.getElementById('editStatus').value = currentEditingAppointment.status || 'pending';

    // Mostrar modal
    editModal.style.display = 'block';
}

function closeEditModal() {
    editModal.style.display = 'none';
    currentEditingAppointment = null;
}

function handleEditSubmit(e) {
    e.preventDefault();

    if (!currentEditingAppointment) return;

    // Actualizar datos
    currentEditingAppointment.clientName = document.getElementById('editName').value;
    currentEditingAppointment.clientPhone = document.getElementById('editPhone').value;
    currentEditingAppointment.date = document.getElementById('editDate').value;
    currentEditingAppointment.time = document.getElementById('editTime').value;
    currentEditingAppointment.status = document.getElementById('editStatus').value;

    // Guardar cambios
    saveAppointments();
    updateAppointmentsList();
    closeEditModal();
}

function handleDelete() {
    if (!currentEditingAppointment) return;

    if (confirm('¿Estás segura de que deseas eliminar esta cita?')) {
        appointments = appointments.filter(app => app.id !== currentEditingAppointment.id);
        saveAppointments();
        updateAppointmentsList();
        closeEditModal();
    }
}

function saveAppointments() {
    localStorage.setItem('kaluSpanailsAppointments', JSON.stringify(appointments));
}

// Funciones de utilidad
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(time) {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    return `${hour}:${minute} ${hourNum >= 12 ? 'PM' : 'AM'}`;
}

function getStatusText(status) {
    const statusTexts = {
        pending: 'Pendiente',
        completed: 'Completada',
        cancelled: 'Cancelada'
    };
    return statusTexts[status] || 'Pendiente';
}