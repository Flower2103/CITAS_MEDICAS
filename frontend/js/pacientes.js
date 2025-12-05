const tabla = document.getElementById("tablaPacientes");
const buscador = document.getElementById("buscador");
const btnBuscar = document.getElementById("btnBuscar");
const btnNuevo = document.getElementById("btnNuevo");

const formulario = document.getElementById("formularioPaciente");
const formPaciente = document.getElementById("formPaciente");
const btnCancelar = document.getElementById("btnCancelar");
const tituloForm = document.getElementById("tituloForm");
const msgServidor = document.getElementById("msgServidor");

let listaPacientes = [];
let listaDoctores = [];
let historialActual = []; // Para filtros

// ============================
// CARGAR DOCTORES
// ============================
async function cargarDoctores() {
  try {
    const resp = await fetch("/data/doctores.json");
    listaDoctores = await resp.json();
  } catch (error) {
    console.error("Error cargando doctores:", error);
  }
}
async function getHistorialPaciente(idPaciente) {
  try {
    const resp = await fetch("/data/citas.json");
    const citas = await resp.json();
    return citas.filter(c => c.pacienteId === idPaciente);
  } catch (error) {
    console.error("Error cargando historial:", error);
    return [];
  }
}
// ============================
// CARGAR PACIENTES
// ============================
async function cargarPacientes() {
  const data = await getPacientes();
  if (!data) return;
  listaPacientes = data;
  mostrarPacientes(data);
}

// ============================
// MOSTRAR PACIENTES EN TABLA
// ============================
function mostrarPacientes(pacientes) {
  tabla.innerHTML = "";
  if (!pacientes || pacientes.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin resultados</td></tr>`;
    return;
  }

  pacientes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id.replace("P","")}</td>
      <td>${p.nombre}</td>
      <td>${p.edad}</td>
      <td>${p.telefono}</td>
      <td>${p.email}</td>
      <td>${p.fechaRegistro}</td>
      <td>
        <button onclick="verHistorial('${p.id}')">Historial</button>
        <button onclick="editarPaciente('${p.id}')">Editar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ============================
// BOTONES Y BUSCADOR
// ============================
btnBuscar.addEventListener("click", () => {
  const texto = buscador.value.toLowerCase();
  const filtrados = listaPacientes.filter(p =>
    p.id.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto)
  );
  mostrarPacientes(filtrados);
});

btnNuevo.addEventListener("click", () => {
  formulario.style.display = "block";
  formPaciente.reset();
  tituloForm.textContent = "Nuevo Paciente";
  msgServidor.textContent = "";
});

btnCancelar.addEventListener("click", () => {
  formulario.style.display = "none";
  msgServidor.textContent = "";
});


// ============================
// OBTENER HISTORIAL DE UN PACIENTE
// ============================

async function verHistorial(idPaciente) {
  const historialSection = document.getElementById("historialSection");
  const header = document.getElementById("headerPaciente");
  const tablaHist = document.getElementById("tablaHistorial");

  // Buscar paciente
  const paciente = listaPacientes.find(p => p.id === idPaciente);
  if (!paciente) return alert("Paciente no encontrado");

  // Mostrar info del paciente en header
  header.innerHTML = `
    <strong>${paciente.nombre}</strong><br>
    Tel: ${paciente.telefono} | Email: ${paciente.email}
  `;

  historialSection.style.display = "block";
  tablaHist.innerHTML = `<tr><td colspan="6">Cargando...</td></tr>`;

  // Obtener historial desde API
  const citas = await getHistorialPaciente(idPaciente);

  historialActual = citas; // Guardar para filtros
  mostrarHistorialTabla(citas);
}

function mostrarHistorialTabla(citas) {
  const tablaHist = document.getElementById("tablaHistorial");
  tablaHist.innerHTML = "";

  if (!citas || citas.length === 0) {
    tablaHist.innerHTML = `<tr><td colspan="6">Sin citas registradas</td></tr>`;
    return;
  }

  citas.forEach(c => {
    const doctor = listaDoctores.find(d => d.id === c.doctorId);
    const nombreDoctor = doctor ? doctor.nombre : "—";
    const especialidad = doctor ? doctor.especialidad : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.fecha}</td>
      <td>${c.hora}</td>
      <td>${nombreDoctor}</td>
      <td>${especialidad}</td>
      <td>${c.motivo}</td>
      <td>${c.estado}</td>
    `;
    tablaHist.appendChild(tr);
  });
}

function filtrarHistorial(estado) {
  if (!historialActual) return;

  if (estado === "todas") {
    mostrarHistorialTabla(historialActual);
    return;
  }

  const filtradas = historialActual.filter(c => c.estado === estado);
  mostrarHistorialTabla(filtradas);
}

function limpiarHistorial() {
  const historialSection = document.getElementById("historialSection");
  historialSection.style.display = "none";
  historialActual = [];
  document.getElementById("tablaHistorial").innerHTML = "";
}

// ============================
// EDITAR PACIENTE
// ============================
function editarPaciente(idPaciente) {
  const paciente = listaPacientes.find(p => p.id === idPaciente);
  if (!paciente) return alert("Paciente no encontrado");

  // Mostrar formulario
  formulario.style.display = "block";
  tituloForm.textContent = "Editar Paciente";

  // Rellenar campos
  formPaciente.nombre.value = paciente.nombre;
  formPaciente.edad.value = paciente.edad;
  formPaciente.telefono.value = paciente.telefono;
  formPaciente.email.value = paciente.email;

  // Guardar id para editar
  formPaciente.setAttribute("data-edit-id", paciente.id);
  
}

// ============================
// INICIO
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDoctores(); // primero doctores
  await cargarPacientes(); // luego pacientes
});


//--------------------
function limpiarErrores() {
  document.getElementById("errorNombre").textContent = "";
  document.getElementById("errorEdad").textContent = "";
  document.getElementById("errorTelefono").textContent = "";
  document.getElementById("errorEmail").textContent = "";
}


//--------------------------
// BORRAR MENSAJES
//---------------------------
msgServidor.textContent = "";

btnNuevo.addEventListener("click", () => {
  msgServidor.textContent = ""; // Borra mensaje anterior
  formulario.style.display = "block";
  formPaciente.reset();
  tituloForm.textContent = "Nuevo Paciente";
});

btnBuscar.addEventListener("click", () => {
  msgServidor.textContent = ""; // Borra mensaje anterior
  const texto = buscador.value.toLowerCase();
  const filtrados = listaPacientes.filter(p =>
    p.id.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto)
  );
  mostrarPacientes(filtrados);
});

function limpiarHistorial() {
  msgServidor.textContent = ""; // Borra mensaje al cerrar historial
  const historialSection = document.getElementById("historialSection");
  historialSection.style.display = "none";
  historialActual = [];
  document.getElementById("tablaHistorial").innerHTML = "";
}

formPaciente.addEventListener("submit", async (e) => {
  e.preventDefault();

  limpiarErrores();
  let valido = true;
  const nombre = formPaciente.nombre.value.trim();
  const edad = Number(formPaciente.edad.value);
  const telefono = formPaciente.telefono.value.trim();
  const email = formPaciente.email.value.trim();

  // Validaciones
  if (!nombre) { document.getElementById("errorNombre").textContent = "Ingrese el nombre"; valido = false; }
  if (!edad || edad <= 0) { document.getElementById("errorEdad").textContent = "Edad inválida"; valido = false; }
  if (!telefono) { document.getElementById("errorTelefono").textContent = "Ingrese un teléfono"; valido = false; }
  else if (telefono.length < 10) { document.getElementById("errorTelefono").textContent = "Mínimo 10 dígitos"; valido = false; }
  if (!email) { document.getElementById("errorEmail").textContent = "Ingrese un correo"; valido = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById("errorEmail").textContent = "Correo inválido"; valido = false; }

  if (!valido) return;

  const editId = formPaciente.getAttribute("data-edit-id"); // clave
  const url = editId ? `/pacientes/${editId}` : "/pacientes";
  const method = editId ? "PUT" : "POST";

  try {
    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, edad, telefono, email })
    });
    const data = await resp.json();

    if (!resp.ok) {
      msgServidor.textContent = data.error || "Error al guardar";
      msgServidor.style.color = "red";
      return;
    }

    msgServidor.textContent = editId ? "Cambios guardados exitosamente ✅" : "Paciente registrado correctamente ✅";
    msgServidor.style.color = "green";

    formulario.style.display = "none";
    formPaciente.reset();
    formPaciente.removeAttribute("data-edit-id"); // importante limpiar
    cargarPacientes();

    setTimeout(() => { msgServidor.textContent = ""; }, 3000);

  } catch (error) {
    msgServidor.textContent = "Error del servidor";
    msgServidor.style.color = "red";
    console.error(error);
  }
});
