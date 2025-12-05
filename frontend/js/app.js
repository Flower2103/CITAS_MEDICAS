const baseURL = "http://localhost:3000"; // tu backend

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

// Actualizar estadísticas
async function cargarEstadisticas() {
  const pacientes = await fetchJSON(`${baseURL}/pacientes`);
  const doctores = await fetchJSON(`${baseURL}/doctores`);
  
  // Total de pacientes y doctores
  document.getElementById("totalPacientes").textContent = pacientes.length;
  document.getElementById("totalDoctores").textContent = doctores.length;

  // Citas programadas hoy
  const hoy = new Date().toLocaleDateString("en-CA");
  const todasLasCitas = await fetchJSON(`${baseURL}/citas`);

  const citasHoy = todasLasCitas.filter(cita => 
  cita.fecha === hoy && cita.estado === "programada"
  );

  document.getElementById("citasHoy").textContent = citasHoy.length; //actualizar contador

  // Citas próximas 24h
  const proximas24h = await fetchJSON(`${baseURL}/citas/proximas`);
  document.getElementById("citas24h").textContent = proximas24h.length;

  // Llenar tabla de citas de hoy
  const tabla = document.getElementById("tablaCitasHoy");
tabla.innerHTML = "";

  citasHoy.forEach(cita => {
    const paciente = pacientes.find(p => p.id === cita.pacienteId)?.nombre || "Desconocido";
    const doctor = doctores.find(d => d.id === cita.doctorId)?.nombre || "Desconocido";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.hora}</td>
      <td>${paciente}</td>
      <td>${doctor}</td>
      <td style="color:${cita.estado === "programada" ? "green" : "red"}">
        ${cita.estado}
      </td>
    `;
    tabla.appendChild(tr);
  });

}

// Inicializar
cargarEstadisticas();
