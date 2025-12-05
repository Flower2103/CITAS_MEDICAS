import { getDoctores } from "./api.js";

export async function mostrarDoctores(container) {
  const doctores = await getDoctores();
  container.innerHTML = "<h2>Doctores</h2>";

  doctores.forEach(d => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${d.nombre}</strong> - ${d.especialidad}<br>
      Horario: ${d.horarioInicio} a ${d.horarioFin}<br>
      Días disponibles: ${d.diasDisponibles.join(", ")}
    `;
    container.appendChild(div);
  });
}
