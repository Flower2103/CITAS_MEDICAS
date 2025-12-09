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

// Variables globales para datos (Se llenan al cargar)
let listaCitas = [];
let listaDoctores = []; 
let listaPacientes = []; 


// ==========================================================
// 1. CARGA DE DATOS Y RENDERIZADO INICIAL
// ==========================================================

// ---------- CARGAR DATOS INICIALES (CITAS, DOCTORES, PACIENTES) ----------
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
        
    } catch (error) {
        console.error("Error crítico al cargar datos:", error);
        
        // Mostrar error visiblemente
        tablaCitas.innerHTML = `<tr><td colspan="9" class="sin-citas">
            ❌ Error al cargar las citas o datos de soporte. Verifique la API.
        </td></tr>`;
    }
}

// -------------MOSTRAR CITAS EN LA TABLA (Función Única y Consolidada) -----------
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
        const doctor = listaDoctores.find(d => d.id === cita.doctorId);
        
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
                <button onclick="verDetallesCita('${cita.id}')" class="btn-actualizar" style="margin: 0.25rem;">👁️ Ver</button>
                ${cita.estado === 'programada' ? 
                    `<button onclick="confirmarCancelarCita('${cita.id}')" class="btn-actualizar" style="margin: 0.25rem; background: #dc3545;">✖ Cancelar</button>` 
                    : ''}
            </td>
        `;
        tablaCitasElement.appendChild(tr);
    });
}


// ==========================================================
// 2. FILTROS Y BÚSQUEDA
// ==========================================================

// -------------LLENAR FILTROS -----------
function llenarFiltros(doctores) {
    // 1. Filtro Doctor
    filtroDoctor.innerHTML = '<option value="">Todos</option>';
    doctores.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        filtroDoctor.appendChild(option);
    });

    // 2. Filtro Estado 
    filtroEstado.innerHTML = `
        <option value="">Todos</option>
        <option value="programada">Programada</option>
        <option value="cancelada">Cancelada</option>
        <option value="completada">Completada</option>
    `;
    
    // 3. Establecer la fecha mínima en el DatePicker a hoy
    const hoy = new Date().toISOString().split('T')[0];
    filtroFecha.min = hoy;
    inputFecha.min = hoy; 
}


// Función principal de filtrado
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
        filtrados = filtrados.filter(c => c.doctorId === doctorFiltro);
    }
    
    mostrarCitas(filtrados);
}

// Asignar Event Listeners a los filtros
filtroFecha.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);
filtroDoctor.addEventListener("change", aplicarFiltros);


// ==========================================================
// 3. FORMULARIO DE CITA (AGENDAR)
// ==========================================================

// ----------- Mostrar formulario nueva cita ----------
btnNuevaCita.addEventListener("click", () => {
    msgServidor.textContent = "";
    formulario.style.display = "block";
    formCita.reset();
    tituloForm.textContent = "Agendar Nueva Cita";
    
    // Inicializar select de doctores
    selectDoctorForm.innerHTML = '<option value="">Seleccione Fecha y Hora</option>';

    // Scroll al formulario
    formulario.scrollIntoView({ behavior: 'smooth' });
});

// ----------- Cancelar formulario ----------
btnCancelarForm.addEventListener("click", () => {
    formulario.style.display = "none";
    msgServidor.textContent = "";
});

// ----------- Buscar doctores disponibles al cambiar fecha/hora ----------
inputFecha.addEventListener("change", buscarDoctoresDisponibles);
inputHora.addEventListener("change", buscarDoctoresDisponibles);
// Buscar doctores disponibles para una fecha y hora
async function buscarDoctoresDisponibles(fecha, hora) {
    try {
        const doctores = await getDoctores();  // Trae todos los doctores
        const citas = await getCitas();        // Trae todas las citas

        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const diaCita = dias[new Date(fecha).getDay()];

        // Hora de la cita en minutos
        const [hCita, mCita] = hora.split(":").map(Number);
        const minutosCita = hCita * 60 + mCita;

        const duracionCita = 60; // Duración de la cita en minutos

        const disponibles = doctores.filter(d => {
            // 1️⃣ Doctor disponible ese día
            if (!d.diasDisponibles.includes(diaCita)) return false;

            // 2️⃣ Hora dentro del rango del doctor
            const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
            const [hFin, mFin] = d.horarioFin.split(":").map(Number);
            const minutosInicio = hInicio * 60 + mInicio;
            const minutosFin = hFin * 60 + mFin;

            if (minutosCita < minutosInicio || (minutosCita + duracionCita) > minutosFin) return false;

            // 3️⃣ Verificar que el doctor no tenga otra cita que se solape
            const ocupada = citas.some(c => {
                if (c.doctorId !== d.id) return false;
                const fechaCitaExistente = new Date(c.fecha).toISOString().split("T")[0];
                if (fechaCitaExistente !== fecha) return false;

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

// Llamada al cambiar fecha u hora en el formulario
document.getElementById("inputFecha").addEventListener("change", actualizarDoctores);
document.getElementById("inputHora").addEventListener("change", actualizarDoctores);

async function actualizarDoctores() {
    const fecha = document.getElementById("inputFecha").value;
    const hora = document.getElementById("inputHora").value;
    const selectDoctor = document.getElementById("selectDoctorForm");

    // Limpiar select antes de llenar
    selectDoctor.innerHTML = '<option value="">Seleccione Fecha y Hora primero</option>';

    if (!fecha || !hora) return;

    try {
        const disponibles = await buscarDoctoresDisponibles(fecha, hora);
        if (disponibles.length === 0) {
            selectDoctor.innerHTML = '<option value="">No hay doctores disponibles</option>';
            return;
        }

        disponibles.forEach(d => {
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = `${d.nombre} (${d.especialidad})`;
            selectDoctor.appendChild(option);
        });
    } catch (err) {
        console.error(err);
        selectDoctor.innerHTML = '<option value="">Error al cargar doctores</option>';
    }
}

// ---------- FORMULARIO SUBMIT (CREAR CITA) --------------
formCita.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgServidor.textContent = "";
    
    const pacienteId = formCita.pacienteId.value.trim();
    const doctorId = formCita.doctorId.value.trim();
    const fecha = formCita.fecha.value;
    const hora = formCita.hora.value;
    const motivo = formCita.motivo ? formCita.motivo.value.trim() : null;
    
    if (!pacienteId || !doctorId || !fecha || !hora) {
        msgServidor.textContent = "⚠️ Faltan datos obligatorios"; 
        msgServidor.style.background = "#f8d7da";
        return; 
    }

    try {
        msgServidor.textContent = "⏳ Agendando cita...";
        msgServidor.style.color = "#856404";
        msgServidor.style.background = "#fff3cd";
        msgServidor.style.padding = "1rem";
        
        // Convertir los IDs a número
        const citaData = { 
            pacienteId: Number(pacienteId), 
            doctorId: Number(doctorId), 
            fecha, 
            hora, 
            motivo,
        };

        const resultado = await addCita(citaData); // El resultado contiene el ID generado

        msgServidor.textContent = `✅ Cita agendada correctamente con ID ${resultado.id}`;
        msgServidor.style.color = "#155724";
        msgServidor.style.background = "#d4edda";
        
        formCita.reset();
        await cargarCitas(); // Recargar y actualizar la tabla

        // Ocultar formulario
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
        console.error("Error al agendar cita:", error);
    }
});


// ... (resto del código de citas.js) ...

// ==========================================================
// 4. ACCIONES DE CITA
// ==========================================================

// ----------- VER DETALLES (SIMULACIÓN) ----------
function verDetallesCita(id) {
    const cita = listaCitas.find(c => c.id === id);
    if (!cita) return alert("Cita no encontrada");

    const paciente = listaPacientes.find(p => String(p.id) === String(cita.pacienteId));
    const doctor = listaDoctores.find(d => d.id === cita.doctorId);

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

// ----------- CANCELAR CITA ----------
function confirmarCancelarCita(id) {
    if (confirm(`¿Está seguro de que desea CANCELAR la cita #${id}? Esta acción no se puede deshacer.`)) {
        cancelarCitaHandler(id);
    }
}

async function cancelarCitaHandler(id) {
    try {
        // Enviar indicador de cancelación en la tabla
        tablaCitas.innerHTML = `<tr><td colspan="9" class="cargando" style="text-align:center; padding: 40px;">Cancelando cita ${id}...</td></tr>`;
        
        await cancelarCita(id); // Función de api.js

        msgServidor.textContent = `✅ Cita #${id} ha sido cancelada.`;
        msgServidor.style.background = "#f8d7da"; // Usamos color de error para la cancelación
        msgServidor.style.color = "#721c24";

        await cargarCitas(); // Recargar y actualizar la tabla

        // Limpiar mensaje
        setTimeout(() => { 
            msgServidor.textContent = "";
            msgServidor.style.background = "";
            msgServidor.style.color = "";
        }, 3000);

    } catch (error) {
        const errorMsg = error.message || "Error al cancelar la cita";
        alert(`Error al cancelar: ${errorMsg}`);
        await cargarCitas(); // Recargar por si falló la UI
    }
}


// ==========================================================
// INICIALIZACIÓN
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    cargarCitas();
});