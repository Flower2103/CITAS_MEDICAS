import { getCitas } from "./api.js";

export async function mostrarCitas(container) {
  const citas = await getCitas();
  container.innerHTML = "<h2>Citas</h2>";

  if (citas.length === 0) {
    container.innerHTML += "<p>No hay citas registradas</p>";
    return;
  }

  citas.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      Paciente ID: ${c.pacienteId} | Doctor ID: ${c.doctorId}<br>
      Fecha: ${c.fecha} Hora: ${c.hora} | Estado: ${c.estado}
    `;
    container.appendChild(div);
  });
}
