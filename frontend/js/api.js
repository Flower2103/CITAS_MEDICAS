const API_URL = 'http://localhost:3000';

// ----------FUNCIÓN GENERICA PARA FETCH -------------
async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Si la respuesta no es OK, intentar extraer el error del backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error; // Re-lanzar el error para que lo maneje quien llamó la función
  }
}

// -------------PACIENTES --------------

// Obtener todos los pacientes
async function getPacientes() {
  return fetchData('/pacientes');
}

// Obtener un paciente por ID
async function getPaciente(id) {
  return fetchData(`/pacientes/${id}`);
}

// Crear nuevo paciente
async function addPaciente(paciente) {
  return fetchData('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  });
}

// Actualizar paciente existente
async function updatePaciente(id, paciente) {
  return fetchData(`/pacientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  });
}

// Obtener historial de citas de un paciente
async function getHistorialPaciente(idPaciente) {
  try {
    const data = await fetchData(`/pacientes/${idPaciente}/historial`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error obteniendo historial del paciente:", error);
    return [];
  }
}

//------------DOCTORES --------------

// Obtener todos los doctores
async function getDoctores() {
  return fetchData('/doctores');
}

// Obtener un doctor por ID
async function getDoctor(id) {
  return fetchData(`/doctores/${id}`);
}

// Crear nuevo doctor
async function addDoctor(doctor) {
  return fetchData('/doctores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctor)
  });
}

// Actualizar doctor existente
async function updateDoctor(id, doctor) {
  return fetchData(`/doctores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctor)
  });
}

// Obtener doctores por especialidad
async function getDoctoresPorEspecialidad(especialidad) {
  return fetchData(`/doctores/especialidad/${especialidad}`);
}

// Obtener agenda/citas de un doctor
async function getHistorialDoctor(idDoctor) {
  return fetchData(`/doctores/${idDoctor}/citas`);
}

// -----------CITAS -----------

// Obtener todas las citas
async function getCitas() {
  return fetchData('/citas');
}

// Obtener una cita por ID
async function getCita(id) {
  return fetchData(`/citas/${id}`);
}

// Crear nueva cita
async function addCita(cita) {
  return fetchData('/citas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cita)
  });
}

// Cancelar una cita
async function cancelarCita(id) {
  return fetchData(`/citas/${id}/cancelar`, { 
    method: 'PUT' 
  });
}

// Obtener citas próximas (próximas 24 horas)
async function getCitasProximas() {
  return fetchData('/citas/proximas');
}

// Obtener doctores disponibles para una fecha y hora específica
async function getDoctoresDisponibles(fecha, hora) {
  return fetchData(`/doctores/disponibles?fecha=${fecha}&hora=${hora}`);
}

// --------------ESTADÍSTICAS ----------

// Obtener estadísticas de citas por doctor
async function getEstadisticasDoctores() {
  try {
    return await fetchData('/estadisticas/doctores');
  } catch (error) {
    console.error("Error al obtener estadísticas de doctores:", error);
    return [];
  }
}

// Obtener especialidad más solicitada
async function getEspecialidadMasSolicitada() {
  try {
    return await fetchData('/estadisticas/especialidades');
  } catch (error) {
    console.error("Error al obtener especialidad más solicitada:", error);
    return { especialidad: null, citas: 0 };
  }
}