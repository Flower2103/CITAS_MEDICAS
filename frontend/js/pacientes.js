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
let historialActual = [];


// CARGAR DOCTORES
async function cargarDoctores() {
  try {
    listaDoctores = await getDoctores();
  } catch (error) {
    console.error("Error cargando doctores:", error);
  }
}


// CARGAR PACIENTES
async function cargarPacientes() {
  const data = await getPacientes();
  if (!data) return;
  listaPacientes = data;
  mostrarPacientes(data);
 }
// MOSTRAR PACIENTES EN TABLA
function mostrarPacientes(pacientes) {
  tabla.innerHTML = "";
  if (!pacientes || pacientes.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px;">Sin resultados</td></tr>`;
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
        <button data-action="historial" data-id="${p.id}" class="btn-actualizar" style="margin: 0.25rem;">📋 Historial</button>
        <button data-action="editar" data-id="${p.id}" class="btn-actualizar" style="margin: 0.25rem;">✏️ Editar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ✅ EVENT DELEGATION para botones de la tabla
document.addEventListener('click', function(e) {
  const target = e.target;
  
  // Botón HISTORIAL
  if (target.dataset.action === 'historial') {
    const pacienteId = target.dataset.id;
    verHistorial(pacienteId);
  }
  
  // Botón EDITAR
  if (target.dataset.action === 'editar') {
    const pacienteId = target.dataset.id;
    editarPaciente(pacienteId);
  }
});


// BOTONES Y BUSCADOR
btnBuscar.addEventListener("click", () => {
  msgServidor.textContent = "";
  const texto = buscador.value.toLowerCase();
  const filtrados = listaPacientes.filter(p =>
    p.id.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto)
  );
  mostrarPacientes(filtrados);
});

btnNuevo.addEventListener("click", () => {
  msgServidor.textContent = "";
  limpiarErrores();
  formulario.style.display = "block";
  formPaciente.reset();
  tituloForm.textContent = "Nuevo Paciente";
  formPaciente.removeAttribute("data-edit-id");
  
  // Scroll al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
});

btnCancelar.addEventListener("click", () => {
  formulario.style.display = "none";
  msgServidor.textContent = "";
  formPaciente.removeAttribute("data-edit-id");
});

// VER HISTORIAL DE UN PACIENTE
async function verHistorial(idPaciente) {
  const historialSection = document.getElementById("historialSection");
  const header = document.getElementById("headerPaciente");
  const tablaHist = document.getElementById("tablaHistorial");

  // Buscar paciente
  const paciente = listaPacientes.find(p => p.id === idPaciente);
  if (!paciente) return alert("Paciente no encontrado");

  // Mostrar info del paciente en header
  header.innerHTML = `
    <strong>👤 ${paciente.nombre}</strong><br>
    <span style="color: #667eea;">📞 ${paciente.telefono}</span> | 
    <span style="color: #667eea;">📧 ${paciente.email}</span>
  `;

  historialSection.style.display = "block";
  tablaHist.innerHTML = `<tr><td colspan="6" class="cargando" style="text-align:center; padding: 40px;">Cargando historial...</td></tr>`;

  // Obtener historial desde API
  try {
    const citas = await getHistorialPaciente(idPaciente);
    historialActual = citas;
    mostrarHistorialTabla(citas);
    
    // Scroll a la sección de historial
    historialSection.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error("Error al cargar historial:", error);
    tablaHist.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 40px;">❌ Error al cargar historial</td></tr>`;
  }
}

function mostrarHistorialTabla(citas) {
  const tablaHist = document.getElementById("tablaHistorial");
  tablaHist.innerHTML = "";

  if (!citas || citas.length === 0) {
    tablaHist.innerHTML = `
      <tr>
        <td colspan="6" class="sin-citas">
          <div class="sin-citas-texto">Sin citas registradas</div>
        </td>
      </tr>`;
    return;
  }

  citas.forEach(c => {
    const doctor = listaDoctores.find(d => String(d.id) === String(c.doctorId));
    const nombreDoctor = doctor ? doctor.nombre : "—";
    const especialidad = doctor ? doctor.especialidad : "—";

    // Determinar clase de estado
    let estadoClass = "";
    if (c.estado === "programada") estadoClass = "estado-programada";
    else if (c.estado === "cancelada") estadoClass = "estado-cancelada";
    else if (c.estado === "completada") estadoClass = "estado-completada";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.fecha}</td>
      <td>${c.hora}</td>
      <td>${nombreDoctor}</td>
      <td>${especialidad}</td>
      <td>${c.motivo || "—"}</td>
      <td><span class="estado-badge ${estadoClass}">${c.estado}</span></td>
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
  msgServidor.textContent = "";
  const historialSection = document.getElementById("historialSection");
  historialSection.style.display = "none";
  historialActual = [];
  document.getElementById("tablaHistorial").innerHTML = "";
}

// EDITAR PACIENTE
function editarPaciente(idPaciente) {
  const paciente = listaPacientes.find(p => p.id === idPaciente);
  if (!paciente) return alert("Paciente no encontrado");

  msgServidor.textContent = "";
  limpiarErrores();
  
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
  
  // Scroll al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
}

// LIMPIAR ERRORES
function limpiarErrores() {
  document.getElementById("errorNombre").textContent = "";
  document.getElementById("errorEdad").textContent = "";
  document.getElementById("errorTelefono").textContent = "";
  document.getElementById("errorEmail").textContent = "";
}


// FORMULARIO SUBMIT
formPaciente.addEventListener("submit", async (e) => {
  e.preventDefault();

  limpiarErrores();
  msgServidor.textContent = "";
  
  let valido = true;
  const nombre = formPaciente.nombre.value.trim();
  const edad = Number(formPaciente.edad.value);
  const telefono = formPaciente.telefono.value.trim();
  const email = formPaciente.email.value.trim();

  // Validaciones básicas
  if (!nombre) { 
    document.getElementById("errorNombre").textContent = "Ingrese el nombre"; 
    valido = false; 
  }
  
  if (!edad || edad <= 0) { 
    document.getElementById("errorEdad").textContent = "Edad inválida"; 
    valido = false; 
  }
  
  if (!telefono) { 
    document.getElementById("errorTelefono").textContent = "Ingrese un teléfono"; 
    valido = false; 
  } else if (telefono.length < 10) { 
    document.getElementById("errorTelefono").textContent = "Mínimo 10 dígitos"; 
    valido = false; 
  }
  
  if (!email) { 
    document.getElementById("errorEmail").textContent = "Ingrese un correo"; 
    valido = false; 
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
    document.getElementById("errorEmail").textContent = "Correo inválido"; 
    valido = false; 
  }

  if (!valido) return;

  const editId = formPaciente.getAttribute("data-edit-id");

  // ✅ VALIDACIÓN DE DUPLICADOS: Teléfono y Email
  const telefonoExiste = listaPacientes.find(p => 
    p.telefono === telefono && p.id !== editId
  );
  
  const emailExiste = listaPacientes.find(p => 
    p.email.toLowerCase() === email.toLowerCase() && p.id !== editId
  );

  if (telefonoExiste) {
    document.getElementById("errorTelefono").textContent = "⚠️ Este teléfono ya está registrado";
    msgServidor.textContent = "❌ El teléfono ya está registrado por otro paciente";
    msgServidor.style.color = "#721c24";
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    return;
  }

  if (emailExiste) {
    document.getElementById("errorEmail").textContent = "⚠️ Este email ya está registrado";
    msgServidor.textContent = "❌ El email ya está registrado por otro paciente";
    msgServidor.style.color = "#721c24";
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    return;
  }

  try {
    msgServidor.textContent = "⏳ Guardando...";
    msgServidor.style.color = "#856404";
    msgServidor.style.background = "#fff3cd";
    msgServidor.style.padding = "1rem";

    let resultado;
    
    if (editId) {
      // Actualizar paciente existente
      resultado = await updatePaciente(editId, { nombre, edad, telefono, email });
      msgServidor.textContent = "✅ Paciente actualizado correctamente";
    } else {
      // Crear nuevo paciente
      resultado = await addPaciente({ nombre, edad, telefono, email });
      msgServidor.textContent = "✅ Paciente registrado correctamente";
    }

    // Éxito
    msgServidor.style.color = "#155724";
    msgServidor.style.background = "#d4edda";
    msgServidor.style.padding = "1rem";

    formPaciente.reset();
    formPaciente.removeAttribute("data-edit-id");
    
    await cargarPacientes();

    // Ocultar formulario después de 2 segundos
    setTimeout(() => {
      formulario.style.display = "none";
      msgServidor.textContent = "";
      msgServidor.style.background = "";
      msgServidor.style.padding = "";
    }, 2000);

  } catch (error) {
    msgServidor.textContent = "❌ " + (error.message || "Error al guardar paciente");
    msgServidor.style.color = "#721c24";
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    console.error("Error al guardar paciente:", error);
  }
});

// INICIO
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDoctores();
  await cargarPacientes();
});