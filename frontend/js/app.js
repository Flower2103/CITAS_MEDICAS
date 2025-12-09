const baseURL = "http://localhost:3000"; 

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

// Actualizar estadísticas
// ========== VARIABLES GLOBALES ==========
let graficaCitasPorMes = null;
let graficaEspecialidades = null;
let graficaCancelaciones = null;

// ========== CARGAR ESTADÍSTICAS DEL DASHBOARD ==========
async function cargarEstadisticas() {
  try {
    // Obtener datos usando api.js
    const [pacientes, doctores, todasLasCitas, proximas24h] = await Promise.all([
      getPacientes(),
      getDoctores(),
      getCitas(),
      getCitasProximas()
    ]);

    // Actualizar contadores principales
    document.getElementById("totalPacientes").textContent = pacientes.length;
    document.getElementById("totalDoctores").textContent = doctores.length;
    document.getElementById("citas24h").textContent = proximas24h.length;

    // Filtrar citas de hoy
    const hoy = new Date().toLocaleDateString("en-CA");
    const citasHoy = todasLasCitas.filter(cita => 
      cita.fecha === hoy && cita.estado === "programada"
    );
    document.getElementById("citasHoy").textContent = citasHoy.length;

    // Llenar tabla de citas de hoy
    llenarTablaCitasHoy(citasHoy, pacientes, doctores);

    // Cargar gráficas
    cargarGraficas(todasLasCitas, doctores);

  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    alert("No se pudieron cargar las estadísticas. Verifique la conexión con el servidor.");
  }
}

// ========== LLENAR TABLA DE CITAS DE HOY ==========
function llenarTablaCitasHoy(citasHoy, pacientes, doctores) {
  const tabla = document.getElementById("tablaCitasHoy");
  tabla.innerHTML = "";

  if (citasHoy.length === 0) {
    tabla.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#999;">No hay citas programadas para hoy</td></tr>`;
    return;
  }

  // Ordenar por hora
  citasHoy.sort((a, b) => a.hora.localeCompare(b.hora));

  citasHoy.forEach(cita => {
    const paciente = pacientes.find(p => p.id === cita.pacienteId);
    const doctor = doctores.find(d => d.id === cita.doctorId);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.hora}</td>
      <td>${paciente ? paciente.nombre : "Desconocido"}</td>
      <td>${doctor ? doctor.nombre : "Desconocido"}</td>
      <td><span class="estado-${cita.estado}">${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}</span></td>
    `;
    tabla.appendChild(tr);
  });
}

// ========== CARGAR GRAFICAS ==========
function cargarGraficas(citas, doctores) {
  crearGraficaCitasPorMes(citas);
  crearGraficaEspecialidades(citas, doctores);
  crearGraficaCancelaciones(citas);
}

// ========== GRAFICA DE CITAS POR MES ==========
function crearGraficaCitasPorMes(citas) {
  const ctx = document.getElementById('graficaCitasPorMes');
  if (!ctx) return;

  const citasPorMes = {};
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Inicializar todos los meses en 0
  meses.forEach((mes, index) => {
    citasPorMes[index] = 0;
  });

  // Contar citas por mes
  citas.forEach(cita => {
    const fecha = new Date(cita.fecha + 'T00:00:00');
    const mes = fecha.getMonth();
    citasPorMes[mes]++;
  });

  const labels = meses;
  const datos = meses.map((_, index) => citasPorMes[index]);

  // Destruir gráfica anterior si existe
  if (graficaCitasPorMes) {
    graficaCitasPorMes.destroy();
  }

  // Crear nueva gráfica
  graficaCitasPorMes = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Citas',
        data: datos,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Citas por Mes',
          font: { size: 18, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            stepSize: 1,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ========== GRAFICA DE ESPECIALIDADES ==========
function crearGraficaEspecialidades(citas, doctores) {
  const ctx = document.getElementById('graficaEspecialidades');
  if (!ctx) return;

  const citasPorEspecialidad = {};

  // Contar citas por especialidad
  citas.forEach(cita => {
    const doctor = doctores.find(d => d.id === cita.doctorId);
    if (doctor) {
      const esp = doctor.especialidad;
      citasPorEspecialidad[esp] = (citasPorEspecialidad[esp] || 0) + 1;
    }
  });

  // Ordenar de mayor a menor
  const especialidadesOrdenadas = Object.entries(citasPorEspecialidad)
    .sort((a, b) => b[1] - a[1]);

  const labels = especialidadesOrdenadas.map(e => e[0]);
  const datos = especialidadesOrdenadas.map(e => e[1]);

  const colores = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)'
  ];

  // Destruir gráfica anterior
  if (graficaEspecialidades) {
    graficaEspecialidades.destroy();
  }

  // Crear nueva gráfica
  graficaEspecialidades = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Citas',
        data: datos,
        backgroundColor: colores.slice(0, labels.length),
        borderColor: colores.slice(0, labels.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Especialidades Más Solicitadas',
          font: { size: 18, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              return `Citas: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            stepSize: 1,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ========== GRAFICA DE CANCELACIONES ==========
function crearGraficaCancelaciones(citas) {
  const ctx = document.getElementById('graficaCancelaciones');
  if (!ctx) return;

  const estados = {
    programada: 0,
    completada: 0,
    cancelada: 0
  };

  // Contar citas por estado
  citas.forEach(cita => {
    if (estados.hasOwnProperty(cita.estado)) {
      estados[cita.estado]++;
    }
  });

  const total = citas.length;
  const tasaCancelacion = total > 0 
    ? ((estados.cancelada / total) * 100).toFixed(1)
    : 0;

  // Actualizar indicador de tasa de cancelación
  const elementoTasa = document.getElementById('tasaCancelacion');
  if (elementoTasa) {
    elementoTasa.textContent = `${tasaCancelacion}%`;
    elementoTasa.style.color = parseFloat(tasaCancelacion) > 20 ? '#dc3545' : '#28a745';
  }

  const labels = ['Programadas', 'Completadas', 'Canceladas'];
  const datos = [estados.programada, estados.completada, estados.cancelada];
  const colores = [
    'rgba(54, 162, 235, 0.8)',   // Azul
    'rgba(75, 192, 192, 0.8)',   // Verde
    'rgba(255, 99, 132, 0.8)'    // Rojo
  ];

  // Destruir gráfica anterior
  if (graficaCancelaciones) {
    graficaCancelaciones.destroy();
  }

  // Crear nueva gráfica
  graficaCancelaciones = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: datos,
        backgroundColor: colores,
        borderColor: colores.map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribución de Estados',
          font: { size: 18, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        legend: { 
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// ========== ACTUALIZAR ESTADISTICAS ==========
function actualizarEstadisticas() {
  cargarEstadisticas();
}

// ========== INICIALIZAR ==========
document.addEventListener("DOMContentLoaded", () => {
  cargarEstadisticas();

  // Botón de actualizar
  const btnActualizar = document.getElementById("btnActualizar");
  if (btnActualizar) {
    btnActualizar.addEventListener("click", actualizarEstadisticas);
  }
});