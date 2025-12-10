const tablaCitas = document.getElementById("tablaCitas");
const btnNuevaCita = document.getElementById("btnNuevaCita");
const formulario = document.getElementById("formularioCita");
const formCita = document.getElementById("formCita");
const btnCancelarForm = document.getElementById("btnCancelarForm");
const tituloForm = document.getElementById("tituloForm");
const msgServidor = document.getElementById("msgServidor");

// Filtros
const filtroFecha = document.getElementById("filtroFecha");
const filtroEstado = document.getElementById("filtroEstado");
const filtroDoctor = document.getElementById("filtroDoctor");

// Campos del formulario
const inputFecha = document.getElementById("inputFecha");
const selectDoctorForm = document.getElementById("selectDoctorForm");
const selectPacienteForm = document.getElementById("selectPacienteForm");

// Variables globales para datos 
let listaCitas = [];
let listaDoctores = []; 
let listaPacientes = []; 

// ---------- CARGAR DATOS INICIALES ----------
async function cargarCitas() {
    try {
        // Ejecutar las tres llamadas a la API en paralelo
        const [citasData, doctoresData, pacientesData] = await Promise.all([
            getCitas(),
            getDoctores(),
            getPacientes()
        ]);

        // 1. Citas (Maneja el caso donde el servidor devuelve { mensaje: "No hay citas..." })
        if (citasData && citasData.mensaje) {
            listaCitas = [];
        } else if (Array.isArray(citasData)) {
            listaCitas = citasData;
        } else {
            listaCitas = [];
        }
        
        // 2. Doctores y Pacientes
        listaDoctores = doctoresData || [];
        listaPacientes = pacientesData || [];

        // Mostrar la tabla y llenar los filtros
        mostrarCitas(listaCitas);
        llenarFiltros(listaDoctores);
        llenarSelectPacientes(listaPacientes);
        
    } catch (error) {
        console.error("Error crítico al cargar datos:", error);
        
        // Mostrar error visiblemente
        tablaCitas.innerHTML = `<tr><td colspan="9" class="sin-citas">
            ❌ Error al cargar las citas o datos de soporte. Verifique la API.
        </td></tr>`;
    }
}

// ------------- LLENAR SELECT DE PACIENTES -----------
function llenarSelectPacientes(pacientes) {
    if (!selectPacienteForm) return;
    
    selectPacienteForm.innerHTML = '<option value="">Seleccione un paciente</option>';
    pacientes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nombre} (${p.email})`;
        selectPacienteForm.appendChild(option);
    });
}

// ------------- MOSTRAR CITAS EN LA TABLA -----------
function mostrarCitas(citas) {
    const tablaCitasElement = document.getElementById("tablaCitas");
    tablaCitasElement.innerHTML = "";
    
    if (!citas || citas.length === 0) {
        tablaCitasElement.innerHTML = `
            <tr>
                <td colspan="9" class="sin-citas">
                    <div class="sin-citas-texto">No hay citas registradas con los filtros aplicados.</div>
                </td>
            </tr>`;
        return;
    }

    // Iterar y renderizar filas
    citas.forEach(cita => {
        // Obtener datos del paciente y doctor usando las listas globales
        const paciente = listaPacientes.find(p => String(p.id) === String(cita.pacienteId));
        const doctor = listaDoctores.find(d => String(d.id) === String(cita.doctorId));
        
        // Determinar clase de estado
        let estadoClass = "";
        if (cita.estado === "programada") estadoClass = "estado-programada";
        else if (cita.estado === "cancelada") estadoClass = "estado-cancelada";
        else if (cita.estado === "completada") estadoClass = "estado-completada";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cita.id}</td>
            <td>${cita.fecha}</td>
            <td>${cita.hora}</td>
            <td>${paciente ? paciente.nombre : "—"}</td>
            <td>${doctor ? doctor.nombre : "—"}</td>
            <td>${doctor ? doctor.especialidad : "—"}</td>
            <td>${cita.motivo || "—"}</td>
            <td><span class="estado-badge ${estadoClass}">${cita.estado || "—"}</span></td>
            <td>
                <button data-action="ver" data-id="${cita.id}" class="btn-actualizar" style="margin: 0.25rem;">👁️ Ver</button>
                ${cita.estado === 'programada' ? 
                    `<button data-action="cancelar" data-id="${cita.id}" class="btn-actualizar" style="margin: 0.25rem; background: #dc3545;">✖ Cancelar</button>` 
                    : ''}
            </td>
        `;
        tablaCitasElement.appendChild(tr);
    });
}

// ------------- LLENAR FILTROS -----------
function llenarFiltros(doctores) {
    filtroDoctor.innerHTML = '<option value="">Todos</option>';
    doctores.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        filtroDoctor.appendChild(option);
    });

    filtroEstado.innerHTML = `
        <option value="">Todos</option>
        <option value="programada">Programada</option>
        <option value="cancelada">Cancelada</option>
        <option value="completada">Completada</option>
    `;

    // FECHA MÍNIMA 
    const hoy = new Date();
    const fechaHoyLocal = hoy.getFullYear() + "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoy.getDate()).padStart(2, "0");

    filtroFecha.min = fechaHoyLocal;
    inputFecha.min = fechaHoyLocal;
}


// ------------- APLICAR FILTROS -----------
function aplicarFiltros() {
    const fechaFiltro = filtroFecha.value;
    const estadoFiltro = filtroEstado.value;
    const doctorFiltro = filtroDoctor.value;

    let filtrados = listaCitas;

    if (fechaFiltro) {
        filtrados = filtrados.filter(c => c.fecha === fechaFiltro);
    }

    if (estadoFiltro) {
        filtrados = filtrados.filter(c => c.estado === estadoFiltro);
    }

    if (doctorFiltro) {
        filtrados = filtrados.filter(c => String(c.doctorId) === String(doctorFiltro));
    }
    
    mostrarCitas(filtrados);
}

// Limpiar filtros y mostrar todas las citas
function limpiarFiltros() {
    filtroFecha.value = "";
    filtroEstado.value = "";
    filtroDoctor.value = "";
    mostrarCitas(listaCitas);
}

// para botones de la tabla
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Botón VER
    if (target.dataset.action === 'ver') {
        const citaId = target.dataset.id;
        console.log("Click en botón VER, ID:", citaId);
        if (citaId) {
            verDetallesCita(citaId);
        } else {
            console.error("Error: No se pudo obtener el ID de la cita del botón VER");
        }
    }
    
    // Boton CANCELAR
    if (target.dataset.action === 'cancelar') {
        const citaId = target.dataset.id;
        console.log("Click en botón CANCELAR, ID:", citaId, "Tipo:", typeof citaId);
        if (citaId) {
            confirmarCancelarCita(citaId);
        } else {
            console.error("Error: No se pudo obtener el ID de la cita del botón CANCELAR");
            alert("Error: No se pudo identificar la cita a cancelar");
        }
    }
});

// Asignar Event Listeners a los filtros
filtroFecha.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
filtroDoctor.addEventListener("change", aplicarFiltros);

// ----------- Mostrar formulario nueva cita ----------
btnNuevaCita.addEventListener("click", () => {
    msgServidor.textContent = "";
    formulario.style.display = "block";
    formCita.reset();
    tituloForm.textContent = "Agendar Nueva Cita";
    
    // Reiniciar selects
    selectDoctorForm.innerHTML = '<option value="">Primero seleccione fecha y hora</option>';
    
    // Convertir el input de hora en un select con opciones cada hora
    reemplazarInputHoraPorSelect();

    // Scroll al formulario
    formulario.scrollIntoView({ behavior: 'smooth' });
});

// ----------- Cancelar formulario ----------
btnCancelarForm.addEventListener("click", () => {
    formulario.style.display = "none";
    msgServidor.textContent = "";
});

//  Convertir input de hora a select con opciones cada hora
function reemplazarInputHoraPorSelect() {
    const inputHora = document.getElementById("inputHora");
    
    // Si ya es un select, no hacer nada
    if (inputHora && inputHora.tagName === 'SELECT') return;
    
    // Si no existe el elemento, salir
    if (!inputHora) return;
    
    // Crear un nuevo select
    const selectHora = document.createElement('select');
    selectHora.id = 'inputHora';
    selectHora.name = 'hora';
    selectHora.required = true;
    selectHora.style.padding = '0.75rem';
    selectHora.style.border = '2px solid #e0e0e0';
    selectHora.style.borderRadius = '8px';
    
    // Agregar opcion por defecto
    const optionDefault = document.createElement('option');
    optionDefault.value = '';
    optionDefault.textContent = 'Seleccione una hora';
    selectHora.appendChild(optionDefault);
    
    // Generar opciones de 7:00 AM a 8:00 PM (cada hora)
    for (let hora = 0; hora <= 23; hora++) {
        const option = document.createElement('option');
        const horaStr = String(hora).padStart(2, '0') + ':00';
        option.value = horaStr;
        option.textContent = horaStr;
        selectHora.appendChild(option);
    }

    // Reemplazar el input por el select
    inputHora.parentNode.replaceChild(selectHora, inputHora);
    
    // Agregar event listener
    selectHora.addEventListener('change', actualizarDoctores);
}

// ----------- Buscar doctores disponibles -----------
async function buscarDoctoresDisponibles(fecha, hora) {
    try {
        const doctores = await getDoctores();
        const citas = await getCitas();

        // Manejar el caso donde getCitas devuelve {mensaje: "..."}
        const citasArray = Array.isArray(citas) ? citas : [];

        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const diaCita = dias[new Date(fecha + 'T00:00:00').getDay()];

        const [hCita, mCita] = hora.split(":").map(Number);
        const minutosCita = hCita * 60 + mCita;
        const duracionCita = 60;

        const disponibles = doctores.filter(d => {
            // Doctor disponible ese dia
            if (!d.diasDisponibles.includes(diaCita)) return false;

            // Hora dentro del rango del doctor
            const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
            const [hFin, mFin] = d.horarioFin.split(":").map(Number);
            const minutosInicio = hInicio * 60 + mInicio;
            const minutosFin = hFin * 60 + mFin;

            // VALIDACIÓN CORRECTA: La cita debe INICIAR y TERMINAR dentro del horario
            if (minutosCita < minutosInicio || (minutosCita + duracionCita) > minutosFin) {
                return false;
            }

            // Verificar que el doctor no tenga otra cita que se solape
            const ocupada = citasArray.some(c => {
                if (String(c.doctorId) !== String(d.id)) return false;
                if (c.estado !== "programada") return false;
                
                const fechaCitaExistente = new Date(c.fecha + 'T00:00:00').toISOString().split("T")[0];
                const fechaBusqueda = new Date(fecha + 'T00:00:00').toISOString().split("T")[0];
                
                if (fechaCitaExistente !== fechaBusqueda) return false;

                const [hc, mc] = c.hora.split(":").map(Number);
                const inicioCitaExistente = hc * 60 + mc;
                const finCitaExistente = inicioCitaExistente + duracionCita;

                // Si se solapan las citas
                return minutosCita < finCitaExistente && (minutosCita + duracionCita) > inicioCitaExistente;
            });

            return !ocupada;
        });

        return disponibles;

    } catch (err) {
        console.error("Error al buscar doctores disponibles:", err);
        throw new Error("Error al buscar doctores disponibles");
    }
}

// Actualizar select de doctores cuando cambia fecha u hora
async function actualizarDoctores() {
    const fecha = document.getElementById("inputFecha").value;
    const selectHora = document.getElementById("inputHora");
    const hora = selectHora ? selectHora.value : null;
    const selectDoctor = document.getElementById("selectDoctorForm");

    if (!selectDoctor) return;

    selectDoctor.innerHTML = '<option value="">Primero seleccione fecha y hora</option>';

    if (!fecha || !hora) return;

    try {
        selectDoctor.innerHTML = '<option value="">Buscando doctores disponibles...</option>';
        
        const disponibles = await buscarDoctoresDisponibles(fecha, hora);
        
        if (disponibles.length === 0) {
            selectDoctor.innerHTML = '<option value="">❌ No hay doctores disponibles en esta hora</option>';
            
            // ✅ Mostrar mensaje informativo
            msgServidor.textContent = `ℹ️ No hay doctores disponibles para ${fecha} a las ${hora}. Intente con otra hora.`;
            msgServidor.style.background = "#fff3cd";
            msgServidor.style.color = "#856404";
            msgServidor.style.padding = "1rem";
            return;
        }

        // Limpiar mensaje
        msgServidor.textContent = "";
        msgServidor.style.background = "";
        msgServidor.style.padding = "";

        // Llenar select con doctores disponibles
        selectDoctor.innerHTML = '<option value="">Seleccione un doctor</option>';
        disponibles.forEach(d => {
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = `${d.nombre} - ${d.especialidad} (${d.horarioInicio} a ${d.horarioFin})`;
            selectDoctor.appendChild(option);
        });
        
        // Mensaje de exito
        msgServidor.textContent = `✅ ${disponibles.length} doctor(es) disponible(s)`;
        msgServidor.style.background = "#d4edda";
        msgServidor.style.color = "#155724";
        msgServidor.style.padding = "1rem";
        
    } catch (err) {
        console.error(err);
        selectDoctor.innerHTML = '<option value="">Error al cargar doctores</option>';
        msgServidor.textContent = "❌ Error al buscar doctores disponibles";
        msgServidor.style.background = "#f8d7da";
        msgServidor.style.color = "#721c24";
        msgServidor.style.padding = "1rem";
    }
}

// Event listeners para fecha
inputFecha.addEventListener("change", actualizarDoctores);

// ---------- FORMULARIO SUBMIT --------------
formCita.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgServidor.textContent = "";
    
    const pacienteId = formCita.pacienteId.value.trim();
    const doctorId = formCita.doctorId.value.trim();
    const fecha = formCita.fecha.value;
    const hora = formCita.hora.value;
    const motivoInput = formCita.motivo;
    const motivo = motivoInput ? motivoInput.value.trim() : "";
    
    if (!pacienteId || !doctorId || !fecha || !hora) {
        msgServidor.textContent = "⚠️ Faltan datos obligatorios"; 
        msgServidor.style.background = "#f8d7da";
        msgServidor.style.color = "#721c24";
        msgServidor.style.padding = "1rem";
        return; 
    }

    try {
        msgServidor.textContent = "⏳ Agendando cita...";
        msgServidor.style.color = "#856404";
        msgServidor.style.background = "#fff3cd";
        msgServidor.style.padding = "1rem";
        
        // Enviar IDs como strings
        const citaData = { 
            pacienteId,  // String como "P001"
            doctorId,    // String como "D001"
            fecha, 
            hora, 
            motivo: motivo || undefined
        };

        const resultado = await addCita(citaData);

        msgServidor.textContent = `✅ Cita agendada correctamente con registro ${resultado.id}`;
        msgServidor.style.color = "#155724";
        msgServidor.style.background = "#d4edda";
        
        formCita.reset();
        await cargarCitas();

        setTimeout(() => { 
            formulario.style.display = "none";
            msgServidor.textContent = "";
            msgServidor.style.background = "";
            msgServidor.style.padding = "";
        }, 2000);

    } catch (error) {
        const errorMsg = error.message || "Error al agendar cita";
        msgServidor.textContent = "❌ " + errorMsg;
        msgServidor.style.background = "#f8d7da";
        msgServidor.style.color = "#721c24";
        msgServidor.style.padding = "1rem";
        console.error("Error al agendar cita:", error);
    }
});


// ----------- VER DETALLE DE CITA ABAJO -----------
function verDetallesCita(id) {
    const cita = listaCitas.find(c => String(c.id) === String(id));
    if (!cita) return;

    const paciente = listaPacientes.find(p => String(p.id) === String(cita.pacienteId));
    const doctor = listaDoctores.find(d => String(d.id) === String(cita.doctorId));

    // -------- TABLA CITA --------
    document.getElementById("tablaVerCita").innerHTML = `
        <tr>
            <td style="padding: 16px 20px;">${cita.fecha}</td>
            <td style="padding: 16px 20px;">${cita.hora}</td>
            <td style="padding: 16px 20px;">${cita.motivo || "No especificado"}</td>
            <td style="padding: 16px 20px;">
                <span class="estado-badge estado-${cita.estado}">
                    ${cita.estado.toUpperCase()}
                </span>
            </td>
        </tr>
    `;

    // -------- TABLA PACIENTE --------
    document.getElementById("tablaVerPaciente").innerHTML = paciente ? `
        <tr>
            <td style="padding: 16px 20px;">${paciente.id}</td>
            <td style="padding: 16px 20px;">${paciente.nombre}</td>
            <td style="padding: 16px 20px;">${paciente.edad}</td>
            <td style="padding: 16px 20px;">${paciente.telefono}</td>
            <td style="padding: 16px 20px;">${paciente.email}</td>
        </tr>
    ` : `<tr><td colspan="5" style="padding: 16px 20px; text-align: center;">Paciente no encontrado</td></tr>`;

    // -------- TABLA DOCTOR --------
    document.getElementById("tablaVerDoctor").innerHTML = doctor ? `
        <tr>
            <td style="padding: 16px 20px;">${doctor.id}</td>
            <td style="padding: 16px 20px;">${doctor.nombre}</td>
            <td style="padding: 16px 20px;">${doctor.especialidad}</td>
            <td style="padding: 16px 20px;">${doctor.horarioInicio} - ${doctor.horarioFin}</td>
            <td style="padding: 16px 20px;">${doctor.diasDisponibles.join(", ")}</td>
        </tr>
    ` : `<tr><td colspan="5" style="padding: 16px 20px; text-align: center;">Doctor no encontrado</td></tr>`;

    // -------- BOTÓN CANCELAR SOLO SI ES PROGRAMADA --------
    const btnCancelar = document.getElementById("btnCancelarCita");

    if (cita.estado === "programada") {
        btnCancelar.style.display = "inline-block";
        btnCancelar.onclick = () => {
            confirmarCancelarCita(cita.id);
            cerrarVerCita();
        };
    } else {
        btnCancelar.style.display = "none";
    }

    // -------- MOSTRAR SECCIÓN ABAJO --------
    document.getElementById("verCitaSection").style.display = "block";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

// -------- CERRAR DETALLE --------
function cerrarVerCita() {
    document.getElementById("verCitaSection").style.display = "none";
}

//  Event listener para botón "Cerrar" del detalle
const btnCerrarDetalle = document.getElementById("btnCerrarDetalle");
if (btnCerrarDetalle) {
    btnCerrarDetalle.addEventListener("click", cerrarVerCita);
}



// ----------- CANCELAR CITA ----------
let citaIdParaCancelar = null;

function confirmarCancelarCita(id) {
    console.log("confirmarCancelarCita llamada con ID:", id, "Tipo:", typeof id);
    
    if (!id) {
        console.error("Error: ID es null, undefined o vacío");
        alert("Error: No se pudo identificar la cita a cancelar");
        return;
    }
    
    // Guardar el ID de la cita a cancelar
    citaIdParaCancelar = id;
    console.log("citaIdParaCancelar guardado:", citaIdParaCancelar);
    
    // Actualizar mensaje del modal
    const mensajeCancelar = document.getElementById("mensajeCancelar");
    mensajeCancelar.textContent = `¿Está seguro de que desea CANCELAR la cita #${id}?`;
    
    // Mostrar modal
    const modal = document.getElementById("modalCancelar");
    modal.style.display = "flex";
    console.log("Modal mostrado");
}

// Event listeners para los botones del modal
const btnConfirmarCancelar = document.getElementById("btnConfirmarCancelar");
const btnCerrarModal = document.getElementById("btnCerrarModal");

if (btnConfirmarCancelar) {
    btnConfirmarCancelar.addEventListener("click", () => {
        if (citaIdParaCancelar) {
            const idAGuardar = citaIdParaCancelar; // Guardar el ID antes de cerrarlo
            cerrarModal();
            citaIdParaCancelar = null; // Resetear despues de guardar
            cancelarCitaHandler(idAGuardar); // Usar el ID guardado
        }
    });
}

if (btnCerrarModal) {
    btnCerrarModal.addEventListener("click", cerrarModal);
}

// Cerrar modal al hacer click fuera de el
const modal = document.getElementById("modalCancelar");
if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });
}

function cerrarModal() {
    const modal = document.getElementById("modalCancelar");
    modal.style.display = "none";
    citaIdParaCancelar = null;
}

async function cancelarCitaHandler(id) {
    try {
        console.log("=== INTENTANDO CANCELAR CITA ===");
        console.log("ID recibido:", id);
        console.log("Tipo de ID:", typeof id);
        console.log("Longitud del ID:", id ? id.length : "null/undefined");
        console.log("ID en formato ASCII:", id ? Array.from(id).map(c => c.charCodeAt(0)) : "null/undefined");
        
        console.log("Lista de citas disponibles:");
        listaCitas.forEach((c, index) => {
            console.log(`  [${index}] ID: "${c.id}" (tipo: ${typeof c.id}, estado: ${c.estado})`);
        });
        
        // Buscar la cita en la lista local para verificar que existe
        console.log("Buscando cita con ID:", id);
        const citaExiste = listaCitas.find(c => {
            const match = String(c.id) === String(id);
            console.log(`  Comparando "${c.id}" === "${id}": ${match}`);
            return match;
        });
        
        console.log("Resultado de búsqueda:", citaExiste);
        
        if (!citaExiste) {
            console.error("❌ La cita no existe en la lista local");
            console.log("IDs exactos en la lista:", listaCitas.map(c => c.id));
            console.log("ID buscado:", id);
            msgServidor.textContent = `❌ Error: La cita #${id} no existe en el sistema`;
            msgServidor.style.background = "#f8d7da";
            msgServidor.style.color = "#721c24";
            msgServidor.style.padding = "1rem";
            return;
        }
        
        console.log("Estado actual de la cita:", citaExiste.estado);
        
        if (citaExiste.estado !== "programada") {
            console.error("❌ La cita no está en estado programada");
            msgServidor.textContent = `❌ Error: La cita #${id} no está en estado programada (estado actual: ${citaExiste.estado})`;
            msgServidor.style.background = "#f8d7da";
            msgServidor.style.color = "#721c24";
            msgServidor.style.padding = "1rem";
            return;
        }
        
        console.log("✅ Validaciones pasadas, procediendo a cancelar...");
        tablaCitas.innerHTML = `<tr><td colspan="9" class="cargando" style="text-align:center; padding: 40px;">Cancelando cita ${id}...</td></tr>`;
        
        console.log("Llamando a cancelarCita() del API con ID:", id);
        const resultado = await cancelarCita(id);
        console.log("✅ Resultado de cancelarCita():", resultado);
        console.log("Nuevo estado de la cita:", resultado.estado);

        if (resultado && resultado.estado === "cancelada") {
            console.log("✅ Cita cancelada exitosamente en el servidor");
            msgServidor.textContent = `✅ Cita #${id} ha sido cancelada correctamente`;
            msgServidor.style.background = "#d4edda";
            msgServidor.style.color = "#155724";
            msgServidor.style.padding = "1rem";
        } else {
            console.warn("⚠️ La cita fue procesada pero el estado no cambió a cancelada");
            msgServidor.textContent = `⚠️ La operación se completó pero verifica el estado de la cita`;
            msgServidor.style.background = "#fff3cd";
            msgServidor.style.color = "#856404";
            msgServidor.style.padding = "1rem";
        }

        console.log("Recargando lista de citas...");
        await cargarCitas();
        console.log("✅ Lista de citas recargada");
        
        // LIMPIAR FILTROS para mostrar todas las citas despues de cancelar
        console.log("Limpiando filtros...");
        filtroFecha.value = "";
        filtroEstado.value = "";
        filtroDoctor.value = "";
        mostrarCitas(listaCitas); // Mostrar TODAS las citas
        console.log("✅ Filtros limpiados, mostrando todas las citas");

        setTimeout(() => { 
            msgServidor.textContent = "";
            msgServidor.style.background = "";
            msgServidor.style.color = "";
        }, 3000);

    } catch (error) {
        console.error("=== ERROR AL CANCELAR CITA ===");
        console.error("Error completo:", error);
        console.error("Mensaje:", error.message);
        console.error("Stack:", error.stack);
        
        const errorMsg = error.message || "Error al cancelar la cita";
        msgServidor.textContent = `❌ ${errorMsg}`;
        msgServidor.style.background = "#f8d7da";
        msgServidor.style.color = "#721c24";
        msgServidor.style.padding = "1rem";
        
        console.log("Recargando citas después del error...");
        await cargarCitas();
    }
}

// ---------- INICIO ----------
document.addEventListener("DOMContentLoaded", () => {
    cargarCitas();
});