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
const inputHora = document.getElementById("inputHora");
const selectDoctorForm = document.getElementById("selectDoctorForm");
const selectPacienteForm = document.getElementById("selectPacienteForm");

// Variables globales para datos
let listaCitas = [];
let listaDoctores = []; 
let listaPacientes = [];

// Flag para saber si ya se llenó el select de pacientes
let selectPacientesLlenado = false;

// ==========================================================
// 1. CARGA DE DATOS Y RENDERIZADO INICIAL
// ==========================================================

async function cargarCitas() {
    try {
        const [citasData, doctoresData, pacientesData] = await Promise.all([
            getCitas(),
            getDoctores(),
            getPacientes()
        ]);

        // 1. Citas
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

        // Mostrar tabla y filtros
        mostrarCitas(listaCitas);
        llenarFiltros(listaDoctores);
        
        // ✅ SOLO llenar select de pacientes UNA VEZ
        if (!selectPacientesLlenado) {
            llenarSelectPacientes(listaPacientes);
            selectPacientesLlenado = true;
        }
        
    } catch (error) {
        console.error("Error crítico al cargar datos:", error);
        tablaCitas.innerHTML = `<tr><td colspan="9" class="sin-citas">
            ❌ Error al cargar las citas o datos de soporte. Verifique la API.
        </td></tr>`;
    }
}

// Llenar select de pacientes (SOLO SE EJECUTA UNA VEZ)
function llenarSelectPacientes(pacientes) {
    if (!selectPacienteForm) {
        console.error("❌ No se encontró el elemento selectPacienteForm");
        return;
    }

    selectPacienteForm.innerHTML = '';
    
    const optionDefault = document.createElement("option");
    optionDefault.value = "";
    optionDefault.textContent = "Seleccione un paciente";
    selectPacienteForm.appendChild(optionDefault);
    
    pacientes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        selectPacienteForm.appendChild(option);
    });
    
    console.log(`✅ Select de pacientes llenado con ${pacientes.length} pacientes`);
}

// Mostrar citas en la tabla
function mostrarCitas(citas) {
    tablaCitas.innerHTML = "";
    
    if (!citas || citas.length === 0) {
        tablaCitas.innerHTML = `
            <tr>
                <td colspan="9" class="sin-citas">
                    <div class="sin-citas-texto">No hay citas registradas con los filtros aplicados.</div>
                </td>
            </tr>`;
        return;
    }

    citas.forEach(cita => {
        const paciente = listaPacientes.find(p => String(p.id) === String(cita.pacienteId));
        const doctor = listaDoctores.find(d => String(d.id) === String(cita.doctorId));
        
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
                <button onclick="verDetallesCita('${cita.id}')" class="btn-actualizar" style="margin: 0.25rem;">👁️ Ver</button>
                ${cita.estado === 'programada' ? 
                    `<button onclick="confirmarCancelarCita('${cita.id}')" class="btn-actualizar" style="margin: 0.25rem; background: #dc3545;">✖ Cancelar</button>` 
                    : ''}
            </td>
        `;
        tablaCitas.appendChild(tr);
    });
}

// ==========================================================
// 2. FILTROS Y BÚSQUEDA
// ==========================================================

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
    
    const hoy = new Date().toISOString().split('T')[0];
    filtroFecha.min = hoy;
    inputFecha.min = hoy; 
}

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

filtroFecha.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
filtroDoctor.addEventListener("change", aplicarFiltros);

// ==========================================================
// 3. FORMULARIO DE CITA (AGENDAR)
// ==========================================================

btnNuevaCita.addEventListener("click", () => {
    msgServidor.textContent = "";
    formulario.style.display = "block";
    formCita.reset();
    tituloForm.textContent = "Agendar Nueva Cita";
    
    selectDoctorForm.innerHTML = '<option value="">Seleccione Fecha y Hora primero</option>';
    formulario.scrollIntoView({ behavior: 'smooth' });
});

btnCancelarForm.addEventListener("click", () => {
    formulario.style.display = "none";
    msgServidor.textContent = "";
});

// Buscar doctores disponibles para una fecha y hora
async function buscarDoctoresDisponibles() {
    const fecha = inputFecha.value;
    const hora = inputHora.value;

    selectDoctorForm.innerHTML = '<option value="">Cargando...</option>';

    if (!fecha || !hora) {
        selectDoctorForm.innerHTML = '<option value="">Seleccione Fecha y Hora primero</option>';
        return;
    }

    try {
        const doctores = await getDoctores();
        const citas = await getCitas();

        console.log("=== DEBUG BUSCAR DOCTORES ===");
        console.log("Fecha:", fecha, "Hora:", hora);
        console.log("Total doctores:", doctores.length);

        if (!Array.isArray(doctores) || doctores.length === 0) {
            selectDoctorForm.innerHTML = '<option value="">No hay doctores registrados</option>';
            return;
        }

        const citasArray = Array.isArray(citas) ? citas : [];

        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const fechaObj = new Date(fecha + 'T00:00:00');
        const diaCita = dias[fechaObj.getDay()];

        const [hCita, mCita] = hora.split(":").map(Number);
        const minutosCita = hCita * 60 + mCita;
        const duracionCita = 60;

        console.log(`🗓️ Día: ${diaCita}, ⏰ Hora: ${hora} (${minutosCita} minutos)`);

        const disponibles = doctores.filter(d => {
            if (!d || !d.diasDisponibles || !d.horarioInicio || !d.horarioFin) {
                console.warn(`⚠️ Doctor ${d?.nombre} no tiene campos completos`);
                return false;
            }

            // 1️⃣ Verificar día
            if (!Array.isArray(d.diasDisponibles) || !d.diasDisponibles.includes(diaCita)) {
                console.log(`❌ ${d.nombre}: No trabaja ${diaCita}`);
                return false;
            }

            // 2️⃣ Verificar horario
            try {
                const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
                const [hFin, mFin] = d.horarioFin.split(":").map(Number);
                const minutosInicio = hInicio * 60 + mInicio;
                const minutosFin = hFin * 60 + mFin;
                const citaTermina = minutosCita + duracionCita;

                if (minutosCita < minutosInicio) {
                    console.log(`❌ ${d.nombre}: Muy temprano (inicia ${d.horarioInicio})`);
                    return false;
                }

                if (citaTermina > minutosFin) {
                    console.log(`❌ ${d.nombre}: Terminaría después de ${d.horarioFin}`);
                    return false;
                }

                console.log(`✅ ${d.nombre}: Dentro de horario (${d.horarioInicio}-${d.horarioFin})`);

            } catch (error) {
                console.error(`❌ Error con horario de ${d.nombre}:`, error);
                return false;
            }

            // 3️⃣ Verificar conflictos
            const ocupada = citasArray.some(c => {
                if (String(c.doctorId) !== String(d.id)) return false;
                if (c.estado === "cancelada") return false;

                const fechaCitaExistente = new Date(c.fecha + 'T00:00:00').toISOString().split("T")[0];
                const fechaSeleccionada = new Date(fecha + 'T00:00:00').toISOString().split("T")[0];
                
                if (fechaCitaExistente !== fechaSeleccionada) return false;

                const [hc, mc] = c.hora.split(":").map(Number);
                const inicioCitaExistente = hc * 60 + mc;
                const finCitaExistente = inicioCitaExistente + duracionCita;

                const hayConflicto = minutosCita < finCitaExistente && (minutosCita + duracionCita) > inicioCitaExistente;
                
                if (hayConflicto) {
                    console.log(`⚠️ ${d.nombre}: Conflicto con cita #${c.id} (${c.hora})`);
                }
                
                return hayConflicto;
            });

            if (ocupada) {
                console.log(`❌ ${d.nombre}: Ya tiene cita`);
                return false;
            }

            console.log(`✅ ${d.nombre}: DISPONIBLE`);
            return true;
        });

        console.log(`📊 ${disponibles.length} de ${doctores.length} doctores disponibles`);

        if (disponibles.length === 0) {
            selectDoctorForm.innerHTML = `<option value="">No hay doctores disponibles para ${diaCita} a las ${hora}</option>`;
            return;
        }

        selectDoctorForm.innerHTML = '<option value="">Seleccione un doctor</option>';
        disponibles.forEach(d => {
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = `${d.nombre} - ${d.especialidad} (${d.horarioInicio}-${d.horarioFin})`;
            selectDoctorForm.appendChild(option);
        });

    } catch (err) {
        console.error("❌ Error al buscar doctores:", err);
        selectDoctorForm.innerHTML = '<option value="">Error al cargar doctores</option>';
    }
}

inputFecha.addEventListener("change", buscarDoctoresDisponibles);
inputHora.addEventListener("change", buscarDoctoresDisponibles);

// FORMULARIO SUBMIT
formCita.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgServidor.textContent = "";
    
    const pacienteId = formCita.pacienteId.value.trim();
    const doctorId = formCita.doctorId.value.trim();
    const fecha = formCita.fecha.value;
    const hora = formCita.hora.value;
    const motivo = formCita.motivo ? formCita.motivo.value.trim() : "";
    
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
        
        const citaData = { pacienteId, doctorId, fecha, hora, motivo };
        const resultado = await addCita(citaData);

        msgServidor.textContent = `✅ Cita agendada correctamente con ID ${resultado.id}`;
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
        console.error("Error al agendar cita:", error);
    }
});

// ==========================================================
// 4. ACCIONES DE CITA
// ==========================================================

function verDetallesCita(id) {
    const cita = listaCitas.find(c => c.id === id);
    if (!cita) return alert("Cita no encontrada");

    const paciente = listaPacientes.find(p => String(p.id) === String(cita.pacienteId));
    const doctor = listaDoctores.find(d => String(d.id) === String(cita.doctorId));

    alert(`
📋 Detalles de la Cita #${id}
---------------------------------
Paciente: ${paciente ? paciente.nombre : 'Desconocido'}
Doctor: ${doctor ? doctor.nombre : 'Desconocido'}
Especialidad: ${doctor ? doctor.especialidad : '—'}
Fecha: ${cita.fecha}
Hora: ${cita.hora}
Motivo: ${cita.motivo || 'No especificado'}
Estado: ${cita.estado.toUpperCase()}
    `);
}

function confirmarCancelarCita(id) {
    if (confirm(`¿Está seguro de que desea CANCELAR la cita #${id}? Esta acción no se puede deshacer.`)) {
        cancelarCitaHandler(id);
    }
}

async function cancelarCitaHandler(id) {
    try {
        tablaCitas.innerHTML = `<tr><td colspan="9" class="cargando" style="text-align:center; padding: 40px;">Cancelando cita ${id}...</td></tr>`;
        
        await cancelarCita(id);

        msgServidor.textContent = `✅ Cita #${id} ha sido cancelada.`;
        msgServidor.style.background = "#f8d7da";
        msgServidor.style.color = "#721c24";
        msgServidor.style.padding = "1rem";

        await cargarCitas();

        setTimeout(() => { 
            msgServidor.textContent = "";
            msgServidor.style.background = "";
            msgServidor.style.color = "";
            msgServidor.style.padding = "";
        }, 3000);

    } catch (error) {
        const errorMsg = error.message || "Error al cancelar la cita";
        alert(`Error al cancelar: ${errorMsg}`);
        await cargarCitas();
    }
}

// ==========================================================
// INICIALIZACIÓN
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    cargarCitas();
});