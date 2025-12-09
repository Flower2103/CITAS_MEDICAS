// ELEMENTOS HTML
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
let agendaActual = [];

// ---------- CARGAR DOCTORES----------
async function cargarDoctores() {
  try {
    const data = await getDoctores();
    if (!data) return;
    
    listaDoctores = data;
    mostrarDoctores(data);
    llenarFiltro(data);
  } catch (error) {
    msgServidor.textContent = "Error al cargar doctores";
    msgServidor.style.color = "red";
    console.error(error);
  }
}

// -------------LLENAR FILTRO DE ESPECIALIDADES -----------
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

// ----------------FILTRO POR ESPECIALIDAD ---------------
filtroEspecialidad.addEventListener("change", () => {
  const valor = filtroEspecialidad.value;
  if (!valor) {
    mostrarDoctores(listaDoctores);
  } else {
    const filtrados = listaDoctores.filter(d => d.especialidad === valor);
    mostrarDoctores(filtrados);
  }
});

// -------------MOSTRAR DOCTORES EN LA TABLA -----------
function mostrarDoctores(doctores) {
  tabla.innerHTML = "";
  if (!doctores || doctores.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">Sin resultados</td></tr>`;
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
        <button onclick="verAgenda('${d.id}')" class="btn-actualizar" style="margin: 0.25rem;">📅 Agenda</button>
        <button onclick="editarDoctor('${d.id}')" class="btn-actualizar" style="margin: 0.25rem;">✏️ Editar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ----------BOTÓN BUSCAR ----------------
btnBuscar.addEventListener("click", () => {
  msgServidor.textContent = "";
  const texto = buscador.value.toLowerCase();
  const filtrados = listaDoctores.filter(d =>
    d.id.toLowerCase().includes(texto) || 
    d.nombre.toLowerCase().includes(texto) ||
    d.especialidad.toLowerCase().includes(texto)
  );
  mostrarDoctores(filtrados);
});

// ------------------BOTÓN NUEVO --------------
btnNuevo.addEventListener("click", () => {
  msgServidor.textContent = "";
  formulario.style.display = "block";
  formDoctor.reset();
  tituloForm.textContent = "Nuevo Doctor";
  formDoctor.removeAttribute("data-edit-id");
  
  // Scroll al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
});

// ---------------BOTÓN CANCELAR ----------------
btnCancelar.addEventListener("click", () => {
  formulario.style.display = "none";
  msgServidor.textContent = "";
  formDoctor.removeAttribute("data-edit-id");
});

// -------------EDITAR DOCTOR -----------------
function editarDoctor(id) {
  const doctor = listaDoctores.find(d => d.id === id);
  if (!doctor) return alert("Doctor no encontrado");

  msgServidor.textContent = "";
  formulario.style.display = "block";
  tituloForm.textContent = "Editar Doctor";

  formDoctor.nombre.value = doctor.nombre;
  formDoctor.especialidad.value = doctor.especialidad;
  formDoctor.horarioInicio.value = doctor.horarioInicio;
  formDoctor.horarioFin.value = doctor.horarioFin;

  // Marcar los días disponibles
  const checkboxes = formDoctor.querySelectorAll('input[name="dias"]');
  checkboxes.forEach(cb => {
    cb.checked = doctor.diasDisponibles ? doctor.diasDisponibles.includes(cb.value) : false;
  });

  // Guardar ID para el submit
  formDoctor.setAttribute("data-edit-id", doctor.id);
  
  // Scroll al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
}

// ----------FORMULARIO SUBMIT --------------
formDoctor.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgServidor.textContent = "";
  msgServidor.style.color = "red";
  msgServidor.style.background = "";
  msgServidor.style.padding = "";

  const nombre = formDoctor.nombre.value.trim();
  const especialidad = formDoctor.especialidad.value.trim();
  const horarioInicio = formDoctor.horarioInicio.value;
  const horarioFin = formDoctor.horarioFin.value;
  const dias = Array.from(formDoctor.querySelectorAll('input[name="dias"]:checked'))
                     .map(c => c.value);
  
  // Debug: mostrar todos los valores capturados
  /*
  console.log("=== DEBUG FORMULARIO ===");
  console.log("Nombre:", nombre, "| Vacío?", !nombre);
  console.log("Especialidad:", especialidad, "| Vacío?", !especialidad);
  console.log("Horario Inicio:", horarioInicio, "| Vacío?", !horarioInicio);
  console.log("Horario Fin:", horarioFin, "| Vacío?", !horarioFin);
  console.log("Días seleccionados:", dias, "| Array vacío?", dias.length === 0);
  console.log("========================");
*/
  let valido = true;

 // Validaciones frontend
  if (!nombre) { 
    msgServidor.textContent = "⚠️ Ingrese el nombre del doctor"; 
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    valido = false; 
  }
  else if (!especialidad) { 
    msgServidor.textContent = "⚠️ Seleccione una especialidad"; 
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    valido = false; 
  }
  else if (!horarioInicio || !horarioFin) {
    msgServidor.textContent = "⚠️ Debe especificar horario de inicio y fin";
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    valido = false;
  }
  else if (dias.length === 0) { 
    msgServidor.textContent = "⚠️ Seleccione al menos un día disponible"; 
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    valido = false; 
  }
  
  // Validar horario solo si ambos campos tienen valor
  if (valido && horarioInicio && horarioFin) {
    const [hInicio, mInicio] = horarioInicio.split(":").map(Number);
    const [hFin, mFin] = horarioFin.split(":").map(Number);
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFin = hFin * 60 + mFin;

    console.log("Validación de horario:");
    console.log("  Inicio:", horarioInicio, "→", minutosInicio, "minutos");
    console.log("  Fin:", horarioFin, "→", minutosFin, "minutos");
    console.log("  ¿Inicio >= Fin?", minutosInicio >= minutosFin);

    if (minutosInicio >= minutosFin) {
      msgServidor.textContent = `⚠️ El horario de inicio (${horarioInicio}) debe ser menor que el horario de fin (${horarioFin})`;
      msgServidor.style.background = "#f8d7da";
      msgServidor.style.padding = "1rem";
      valido = false;
    }
  }

  if (!valido) {
    return;
  }

  try {
    msgServidor.textContent = "⏳ Guardando...";
    msgServidor.style.color = "#856404";
    msgServidor.style.background = "#fff3cd";
    msgServidor.style.padding = "1rem";

    const editId = formDoctor.getAttribute("data-edit-id");
    
    // Asegurarse de que diasDisponibles sea un array válido
    const diasDisponibles = dias.length > 0 ? dias : [];
    
    const doctorData = { 
      nombre: nombre, 
      especialidad: especialidad, 
      horarioInicio: horarioInicio, 
      horarioFin: horarioFin, 
      diasDisponibles: diasDisponibles 
    };
    /*
    // Log para debug - mostrar exactamente qué se enviará
    console.log("=== DATOS A ENVIAR AL SERVIDOR ===");
    console.log(JSON.stringify(doctorData, null, 2));
    console.log("===================================");
    */

    // Verificar que todos los campos obligatorios estén presentes
    if (!doctorData.nombre || !doctorData.especialidad || !doctorData.horarioInicio || 
        !doctorData.horarioFin || !doctorData.diasDisponibles || doctorData.diasDisponibles.length === 0) {
      throw new Error("Validación frontend: Faltan datos obligatorios antes de enviar");
    }
    
    let resultado;

    if (editId) {
      // Actualizar doctor existente
      resultado = await updateDoctor(editId, doctorData);
      msgServidor.textContent = "✅ Doctor actualizado correctamente";
    } else {
      // Crear nuevo doctor (sin ID, se genera en servidor)
      resultado = await addDoctor(doctorData);
      msgServidor.textContent = "✅ Doctor registrado correctamente";
    }

    // Éxito
    msgServidor.style.color = "#155724";
    msgServidor.style.background = "#d4edda";
    msgServidor.style.padding = "1rem";
    
    formDoctor.reset();
    formDoctor.removeAttribute("data-edit-id");
    
    // Recargar lista de doctores
    await cargarDoctores();

    // Ocultar formulario después de 2 segundos
    setTimeout(() => { 
      formulario.style.display = "none";
      msgServidor.textContent = "";
      msgServidor.style.background = "";
      msgServidor.style.padding = "";
    }, 2000);

  } catch (error) {
    msgServidor.textContent = "❌ " + (error.message || "Error al guardar doctor");
    msgServidor.style.color = "#721c24";
    msgServidor.style.background = "#f8d7da";
    msgServidor.style.padding = "1rem";
    console.error("Error al guardar doctor:", error);
  }
});

// ------------VER AGENDA DEL DOCTOR -------------
async function verAgenda(doctorId) {
  try {
    const tablaAgenda = document.getElementById("tablaAgenda");
    const doctorInfo = document.getElementById("doctorInfo");
    const agendaSection = document.getElementById("agendaSection");

    tablaAgenda.innerHTML = "<tr><td colspan='6' class='cargando' style='text-align:center; padding: 40px;'>Cargando agenda...</td></tr>";
    doctorInfo.innerHTML = "Cargando...";

    // Obtener citas del doctor
    const citas = await getHistorialDoctor(doctorId);

    // Obtener info del doctor
    const doctor = await getDoctor(doctorId);

    // Obtener pacientes
    const pacientes = await getPacientes();

    // Mostrar info del doctor
    doctorInfo.innerHTML = `
      <strong>👨‍⚕️ ${doctor.nombre}</strong> | 
      <span style="color: #667eea;">🏥 ${doctor.especialidad}</span> | 
      <span>⏰ ${doctor.horarioInicio} - ${doctor.horarioFin}</span> | 
      <span>📅 ${doctor.diasDisponibles.join(", ")}</span>
    `;

    // Limpiar tabla
    tablaAgenda.innerHTML = "";

    if (!citas || citas.length === 0) {
      tablaAgenda.innerHTML = `
        <tr>
          <td colspan="6" class="sin-citas">
            <div class="sin-citas-texto">No hay citas registradas para este doctor</div>
          </td>
        </tr>`;
    } else {
      citas.forEach(c => {
        const paciente = pacientes.find(p => String(p.id) === String(c.pacienteId));
        const row = document.createElement("tr");
        
        // Determinar clase de estado
        let estadoClass = "";
        if (c.estado === "programada") estadoClass = "estado-programada";
        else if (c.estado === "cancelada") estadoClass = "estado-cancelada";
        else if (c.estado === "completada") estadoClass = "estado-completada";
        
        row.innerHTML = `
          <td>${c.fecha}</td>
          <td>${c.hora}</td>
          <td>${paciente ? paciente.nombre : "—"}</td>
          <td>${doctor.especialidad}</td>
          <td>${c.motivo || "—"}</td>
          <td><span class="estado-badge ${estadoClass}">${c.estado || "—"}</span></td>
        `;
        tablaAgenda.appendChild(row);
      });
    }

    agendaActual = citas;
    agendaSection.style.display = "block";
    
    // Scroll a la sección de agenda
    agendaSection.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error("Error verAgenda:", err);
    const tablaAgenda = document.getElementById("tablaAgenda");
    tablaAgenda.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 40px;">❌ Error al cargar la agenda</td></tr>`;
  }
}

//----------------FILTRAR AGENDA -----------------
function filtrarAgenda(estado) {
  const tablaAgenda = document.getElementById("tablaAgenda");
  const doctorId = listaDoctores.find(d => agendaActual.some(c => c.doctorId === d.id))?.id;
  
  if (!doctorId) return;

  const doctor = listaDoctores.find(d => d.id === doctorId);

  tablaAgenda.innerHTML = "";
  
  let citasFiltradas = agendaActual;
  if (estado !== 'todas') {
    citasFiltradas = agendaActual.filter(c => c.estado === estado);
  }

  if (citasFiltradas.length === 0) {
    tablaAgenda.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No hay citas con el estado: ${estado}</td></tr>`;
    return;
  }

  citasFiltradas.forEach(c => {
    getPaciente(c.pacienteId).then(paciente => {
      const row = document.createElement("tr");
      
      let estadoClass = "";
      if (c.estado === "programada") estadoClass = "estado-programada";
      else if (c.estado === "cancelada") estadoClass = "estado-cancelada";
      else if (c.estado === "completada") estadoClass = "estado-completada";
      
      row.innerHTML = `
        <td>${c.fecha}</td>
        <td>${c.hora}</td>
        <td>${paciente ? paciente.nombre : "—"}</td>
        <td>${doctor ? doctor.especialidad : "—"}</td>
        <td>${c.motivo || "—"}</td>
        <td><span class="estado-badge ${estadoClass}">${c.estado || "—"}</span></td>
      `;
      tablaAgenda.appendChild(row);
    });
  });
}

// -------------LIMPIAR/CERRAR AGENDA --------------
function limpiarAgenda() {
  document.getElementById("agendaSection").style.display = "none";
  agendaActual = [];
}

// Alias para compatibilidad
function cerrarAgenda() {
  limpiarAgenda();
}

// -----------------INICIO -------------
document.addEventListener("DOMContentLoaded", () => {
  cargarDoctores();
});