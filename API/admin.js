// Configuración de Supabase
const SUPABASE_URL = 'https://bmfxqpzleqasbggbjafl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZnhxcHpsZXFhc2JnZ2JqYWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg4MDQsImV4cCI6MjA2NTQwNDgwNH0.NVhooCvwEVUpIjxgmRpFIC1t4Qq11FHQtBaTNreel5M';

// Inicializar cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
});

function setupEventListeners() {
    // Filtros
    filterDate.addEventListener('change', updateAppointmentsList);
    filterStatus.addEventListener('change', updateAppointmentsList);

    // Botón de actualizar
    document.getElementById('refreshButton').addEventListener('click', () => {
        loadAppointments();
    });

    // Formulario de edición
    editForm.addEventListener('submit', handleEditSubmit);

    // Botón de cerrar modal
    document.querySelector('.close-btn').addEventListener('click', closeEditModal);

    // Botón de eliminar
    document.querySelector('.delete-btn').addEventListener('click', handleDelete);
}

// FUNCIÓN MODIFICADA: Cargar citas desde Supabase
async function loadAppointments() {
    try {
        // Mostrar indicador de carga
        appointmentsList.innerHTML = '<div class="loading">Cargando citas...</div>';

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            console.error('Error al cargar citas:', error);
            appointmentsList.innerHTML = '<div class="error">Error al cargar las citas</div>';
            return;
        }

        appointments = data || [];
        updateAppointmentsList();

    } catch (error) {
        console.error('Error de conexión:', error);
        appointmentsList.innerHTML = '<div class="error">Error de conexión con la base de datos</div>';
    }
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
    if (filteredAppointments.length === 0) {
        appointmentsList.innerHTML = '<div class="no-appointments">No hay citas para mostrar</div>';
        return;
    }

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
            <h3>${appointment.client_name}</h3>
            <p><i class="fas fa-phone"></i> ${appointment.client_phone}</p>
            <p><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</p>
            <p><i class="fas fa-clock"></i> ${formatTime(appointment.time)}</p>
            <p><i class="fas fa-spa"></i> ${appointment.service_name}</p>
            <p><i class="fas fa-tag"></i> $${Number(appointment.service_price).toLocaleString()}</p>
            <p><i class="fas fa-info-circle"></i> Creada: ${formatDateTime(appointment.created_at)}</p>
        </div>
    `).join('');
}

function openEditModal(appointmentId) {
    currentEditingAppointment = appointments.find(app => app.id === appointmentId);
    if (!currentEditingAppointment) return;

    // Llenar el formulario
    document.getElementById('editName').value = currentEditingAppointment.client_name;
    document.getElementById('editPhone').value = currentEditingAppointment.client_phone;
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

// FUNCIÓN MODIFICADA: Guardar cambios en Supabase
async function handleEditSubmit(e) {
    e.preventDefault();

    if (!currentEditingAppointment) return;

    try {
        // Mostrar indicador de carga
        const saveBtn = e.target.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Guardando...';
        saveBtn.disabled = true;

        const updatedData = {
            client_name: document.getElementById('editName').value,
            client_phone: document.getElementById('editPhone').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            status: document.getElementById('editStatus').value,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('appointments')
            .update(updatedData)
            .eq('id', currentEditingAppointment.id);

        if (error) {
            console.error('Error al actualizar:', error);
            alert('Error al guardar los cambios');
            return;
        }

        // Recargar datos y cerrar modal
        await loadAppointments();
        closeEditModal();

    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error de conexión al guardar');
    } finally {
        // Restaurar botón
        const saveBtn = e.target.querySelector('.save-btn');
        saveBtn.textContent = 'Guardar Cambios';
        saveBtn.disabled = false;
    }
}

// FUNCIÓN MODIFICADA: Eliminar cita de Supabase
async function handleDelete() {
    if (!currentEditingAppointment) return;

    if (confirm('¿Estás segura de que deseas eliminar esta cita?')) {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', currentEditingAppointment.id);

            if (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar la cita');
                return;
            }

            // Recargar datos y cerrar modal
            await loadAppointments();
            closeEditModal();

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión al eliminar');
        }
    }
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

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statusTexts = {
        pending: 'Pendiente',
        completed: 'Completada',
        cancelled: 'Cancelada'
    };
    return statusTexts[status] || 'Pendiente';
}