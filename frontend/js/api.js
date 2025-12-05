const API_URL = 'http://localhost:3000';

// Función genérica para GET, POST, PUT, etc.
async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error en la petición');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    alert(`Error: ${error.message}`);
    return null;
  }
}

// ----------------- PACIENTES -----------------
async function getPacientes() {
  return fetchData('/pacientes');
}

async function addPaciente(paciente) {
  return fetchData('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  });
}
// Obtiene el historial de un paciente por ID
async function getHistorialPaciente(idPaciente) {
  try {
    const resp = await fetch(`/pacientes/${idPaciente}/historial`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }
}

// ----------------- DOCTORES -----------------
async function getDoctores() {
  return fetchData('/doctores');
}

async function addDoctor(doctor) {
  return fetchData('/doctores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctor)
  });
}

// ----------------- CITAS -----------------
async function getCitas() {
  return fetchData('/citas');
}

async function addCita(cita) {
  return fetchData('/citas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cita)
  });
}

async function cancelarCita(id) {
  return fetchData(`/citas/${id}/cancelar`, { method: 'PUT' });
}
