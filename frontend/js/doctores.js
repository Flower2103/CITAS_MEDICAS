// ========== ELEMENTOS HTML ==========
const tabla = document.getElementById("tablaDoctores");
const buscador = document.getElementById("buscador");
const btnBuscar = document.getElementById("btnBuscar");
const btnNuevo = document.getElementById("btnNuevo");

const formulario = document.getElementById("formularioDoctor");
const formDoctor = document.getElementById("formDoctor");
const btnCancelar = document.getElementById("btnCancelar");
const tituloForm = document.getElementById("tituloForm");
const msgServidor = document.getElementById("msgServidor");
const filtroEspecialidad = document.getElementById("filtroEspecialidad");



let listaDoctores = [];
let listCitas = [];
let agendaActual = []; // Para filtros de agenda


// ========== CARGAR DOCTORES ==========
async function cargarDoctores() {
  const data = await getDoctores();
  if (!data) return;
  listaDoctores = data;
  mostrarDoctores(data);
  llenarFiltro(data); // Llenar select cada vez que cargamos
}

// ========== LLENAR FILTRO ==========
function llenarFiltro(doctores) {
  const especialidades = [...new Set(doctores.map(d => d.especialidad))];
  filtroEspecialidad.innerHTML = '<option value="">Todas</option>';
  especialidades.forEach(e => {
    const option = document.createElement("option");
    option.value = e;
    option.textContent = e;
    filtroEspecialidad.appendChild(option);
  });
}

// ========== FILTRO POR ESPECIALIDAD ==========
filtroEspecialidad.addEventListener("change", () => {
  const valor = filtroEspecialidad.value;
  if (!valor) {
    mostrarDoctores(listaDoctores);
  } else {
    const filtrados = listaDoctores.filter(d => d.especialidad === valor);
    mostrarDoctores(filtrados);
  }
});



// ========== MOSTRAR DOCTORES EN TABLA ==========
function mostrarDoctores(doctores) {
  tabla.innerHTML = "";
  if (!doctores || doctores.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin resultados</td></tr>`;
    return;
  }

  doctores.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id.replace("D","")}</td>
      <td>${d.nombre}</td>
      <td>${d.especialidad}</td>
      <td>${d.horarioInicio} - ${d.horarioFin}</td>
      <td>${d.diasDisponibles.join(", ")}</td>
      <td>
        <button onclick="verAgenda('${d.id}')">Agenda</button>
        <button onclick="editarDoctor('${d.id}')">Editar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ========== BOTONES Y BUSCADOR ==========
btnBuscar.addEventListener("click", () => {
  msgServidor.textContent = "";
  const texto = buscador.value.toLowerCase();
  const filtrados = listaDoctores.filter(d =>
    d.id.toLowerCase().includes(texto) || d.nombre.toLowerCase().includes(texto)
  );
  mostrarDoctores(filtrados);
});

btnNuevo.addEventListener("click", () => {
  msgServidor.textContent = "";
  formulario.style.display = "block";
  formDoctor.reset();
  tituloForm.textContent = "Nuevo Doctor";
});

// Cancelar formulario
btnCancelar.addEventListener("click", () => {
  formulario.style.display = "none";
  msgServidor.textContent = "";
});

// ========== EDITAR DOCTOR ==========
function editarDoctor(id) {
  const doctor = listaDoctores.find(d => d.id === id);
  if (!doctor) return alert("Doctor no encontrado");

  const formSection = document.getElementById("formularioDoctor");
  const titulo = document.getElementById("tituloForm");
  const form = document.getElementById("formDoctor");

  formSection.style.display = "block";
  titulo.textContent = "Editar Doctor";

  form.id.value = doctor.id;
  form.nombre.value = doctor.nombre;
  form.especialidad.value = doctor.especialidad;
  form.horarioInicio.value = doctor.horarioInicio;
  form.horarioFin.value = doctor.horarioFin;

  // Marcar los días disponibles
  const checkboxes = form.querySelectorAll('input[name="dias"]');
  checkboxes.forEach(cb => {
    cb.checked = doctor.diasDisponibles ? doctor.diasDisponibles.includes(cb.value) : false;
  });

  // Guardar id para submit
  form.setAttribute("data-edit-id", doctor.id);
}


document.getElementById("formDoctor").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const id = form.id.value;
  const nombre = form.nombre.value;
  const especialidad = form.especialidad.value;
  const horarioInicio = form.horarioInicio.value;
  const horarioFin = form.horarioFin.value;
  const diasDisponibles = Array.from(form.querySelectorAll('input[name="dias"]:checked'))
                             .map(cb => cb.value);

  const doctorData = { nombre, especialidad, horarioInicio, horarioFin, diasDisponibles };

  try {
    if (id) {
      // PUT /doctores/:id
      const res = await fetch(`/doctores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData)
      });
      const updated = await res.json();
      console.log("Doctor actualizado:", updated);
    } else {
      // POST /doctores
      const res = await fetch("/doctores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData)
      });
      const nuevo = await res.json();
      console.log("Doctor creado:", nuevo);
    }

    // Limpiar y recargar tabla
    form.reset();
    document.getElementById("formularioDoctor").style.display = "none";
    cargarDoctores(); // función que refresca la tabla de doctores

  } catch (err) {
    console.error("Error al guardar doctor:", err);
  }
});



// ========== GESTIONAR AGENDA ==========
async function verAgenda(doctorId) {
  try {
    const tabla = document.getElementById("tablaAgenda");
    const info = document.getElementById("doctorInfo");

    // Limpiar tabla e info
    tabla.innerHTML = "";
    info.innerHTML = "";

    // Traer citas
    const res = await fetch(`/doctores/${doctorId}/citas`);
    const citas = await res.json();
    console.log("Citas:", citas);

    // Traer pacientes
    const resPac = await fetch("/pacientes");
    const pacientes = await resPac.json();

    // Traer doctor
    const resDoc = await fetch(`/doctores/${doctorId}`);
    const doctor = await resDoc.json();

    // Mostrar info doctor
    info.textContent = `${doctor.nombre} - ${doctor.especialidad}`;

    // Verificar si hay citas
    if (!citas || citas.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="6" style="text-align:center;">No hay citas registradas</td>`;
      tabla.appendChild(row);
    } else {
      // Llenar tabla con citas
      citas.forEach(c => {
        const paciente = pacientes.find(p => String(p.id) === String(c.pacienteId));
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${c.fecha}</td>
          <td>${c.hora}</td>
          <td>${paciente ? paciente.nombre : "—"}</td>
          <td>${doctor ? doctor.especialidad : "—"}</td>
          <td>${c.motivo || "—"}</td>
          <td>${c.estado || "—"}</td>
        `;
        tabla.appendChild(row);
      });
    }

    // Mostrar sección
    document.getElementById("agendaSection").style.display = "block";

  } catch (err) {
    console.error("Error verAgenda:", err);
    const tabla = document.getElementById("tablaAgenda");
    tabla.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar la agenda</td></tr>`;
  }
}


function mostrarAgendaTabla(citas) {
  const tablaAgenda = document.getElementById("tablaAgenda");
  tablaAgenda.innerHTML = "";

  if (!citas || citas.length === 0) {
    tablaAgenda.innerHTML = `<tr><td colspan="6">Sin citas registradas</td></tr>`;
    return;
  }

  citas.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.fecha}</td>
      <td>${c.hora}</td>
      <td>${c.pacienteNombre || "—"}</td>
      <td>${c.especialidad}</td>
      <td>${c.motivo}</td>
      <td>${c.estado}</td>
    `;
    tablaAgenda.appendChild(tr);
  });
}

function filtrarAgenda(estado) {
  if (!agendaActual) return;

  if (estado === "todas") {
    mostrarAgendaTabla(agendaActual);
    return;
  }

  const filtradas = agendaActual.filter(c => c.estado === estado);
  mostrarAgendaTabla(filtradas);
}

function limpiarAgenda() {
  const agendaSection = document.getElementById("agendaSection");
  agendaSection.style.display = "none";
  agendaActual = [];
  document.getElementById("tablaAgenda").innerHTML = "";
}


// ========== FORMULARIO SUBMIT ==========
//--------------------
// BORRAR MENSAJES
//--------------------
msgServidor.textContent = "";

btnNuevo.addEventListener("click", () => {
  msgServidor.textContent = ""; // borra mensaje anterior
  formulario.style.display = "block";
  formDoctor.reset();
  tituloForm.textContent = "Nuevo Doctor";
  formDoctor.removeAttribute("data-edit-id"); // limpia edición anterior
});

// Buscar doctores
btnBuscar.addEventListener("click", () => {
  msgServidor.textContent = ""; // borra mensaje anterior
  const texto = buscador.value.toLowerCase();
  const filtrados = listaDoctores.filter(d =>
    d.id.toLowerCase().includes(texto) || d.nombre.toLowerCase().includes(texto)
  );
  mostrarDoctores(filtrados);
});

//--------------------
// FORMULARIOsbmit
//--------------------
formDoctor.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgServidor.textContent = "";
  msgServidor.style.color = "red"; // mensaje de error por defecto

  const nombre = formDoctor.nombre.value.trim();
  const especialidad = formDoctor.especialidad.value;
  const horarioInicio = formDoctor.horarioInicio.value;
  const horarioFin = formDoctor.horarioFin.value;
  const dias = Array.from(formDoctor.querySelectorAll('input[name="dias"]:checked'))
                     .map(c => c.value);

  let valido = true;

  // Validaciones front-end
  if (!nombre) { msgServidor.textContent = "Ingrese el nombre"; valido = false; }
  else if (!especialidad) { msgServidor.textContent = "Seleccione especialidad"; valido = false; }
  else if (dias.length === 0) { msgServidor.textContent = "Seleccione al menos un día"; valido = false; }

  // Validar horario correctamente
  const [hInicio, mInicio] = horarioInicio.split(":").map(Number);
  const [hFin, mFin] = horarioFin.split(":").map(Number);
  const minutosInicio = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;

  if (minutosInicio >= minutosFin) {
    msgServidor.textContent = "Horario inicio debe ser menor que horario fin";
    valido = false;
  }

  if (!valido) return; // si hay error, no enviar

  try {
    msgServidor.textContent = "Guardando...";
    msgServidor.style.color = "green";

    const editId = formDoctor.getAttribute("data-edit-id");
    const doctorData = { nombre, especialidad, horarioInicio, horarioFin, diasDisponibles: dias };
    let res = null, data = null;

    if (editId) {
      res = await fetch(`/doctores/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData)
      });
    } else {
      res = await fetch("/doctores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData)
      });
    }

    data = await res.json();

    if (!res.ok) {
      // mostrar error del backend al usuario
      msgServidor.textContent = data.error || "Error al guardar doctor";
      msgServidor.style.color = "red";
      return; // no cerrar el formulario
    }

    // Si todo salió bien
    msgServidor.textContent = editId ? "Cambios guardados ✅" : "Doctor registrado ✅";
    formDoctor.reset();
    formDoctor.removeAttribute("data-edit-id");
    formulario.style.display = "none";
    cargarDoctores();

    setTimeout(() => { msgServidor.textContent = ""; }, 3000);

  } catch (error) {
    msgServidor.textContent = "Error del servidor";
    msgServidor.style.color = "red";
    console.error(error);
  }
});



// ========== INICIO ==========
document.addEventListener("DOMContentLoaded", () => {
  cargarDoctores();
});
