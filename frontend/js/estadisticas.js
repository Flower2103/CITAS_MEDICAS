// ========== INICIALIZAR GRÁFICAS ==========
let graficaCitasPorMes = null;
let graficaEspecialidades = null;
let graficaCancelaciones = null;

// ========== CARGAR TODAS LAS GRÁFICAS ==========
async function cargarGraficas() {
  try {
    const citas = await getCitas();
    const doctores = await getDoctores();

    // Crear las 3 gráficas
    crearGraficaCitasPorMes(citas);
    crearGraficaEspecialidades(citas, doctores);
    crearGraficaCancelaciones(citas);

  } catch (error) {
    console.error("Error al cargar gráficas:", error);
    alert("Error al cargar las estadísticas visuales");
  }
}

// ========== 1. GRÁFICA DE CITAS POR MES ==========
function crearGraficaCitasPorMes(citas) {
  const ctx = document.getElementById('graficaCitasPorMes');
  if (!ctx) return;

  // Agrupar citas por mes
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
    const fecha = new Date(cita.fecha);
    const mes = fecha.getMonth();
    citasPorMes[mes]++;
  });

  // Preparar datos para la gráfica
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
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Citas por Mes',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ========== 2. GRÁFICA DE ESPECIALIDADES MÁS SOLICITADAS ==========
function crearGraficaEspecialidades(citas, doctores) {
  const ctx = document.getElementById('graficaEspecialidades');
  if (!ctx) return;

  // Contar citas por especialidad
  const citasPorEspecialidad = {};

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

  // Preparar datos
  const labels = especialidadesOrdenadas.map(e => e[0]);
  const datos = especialidadesOrdenadas.map(e => e[1]);

  // Colores vibrantes para cada especialidad
  const colores = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)'
  ];

  // Destruir gráfica anterior si existe
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
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ========== 3. GRÁFICA DE TASA DE CANCELACIÓN ==========
function crearGraficaCancelaciones(citas) {
  const ctx = document.getElementById('graficaCancelaciones');
  if (!ctx) return;

  // Contar citas por estado
  const estados = {
    programada: 0,
    completada: 0,
    cancelada: 0
  };

  citas.forEach(cita => {
    if (estados.hasOwnProperty(cita.estado)) {
      estados[cita.estado]++;
    }
  });

  const total = citas.length;
  const tasaCancelacion = total > 0 
    ? ((estados.cancelada / total) * 100).toFixed(1)
    : 0;

  // Mostrar tasa de cancelación
  const elementoTasa = document.getElementById('tasaCancelacion');
  if (elementoTasa) {
    elementoTasa.textContent = `${tasaCancelacion}%`;
    elementoTasa.style.color = tasaCancelacion > 20 ? '#dc3545' : '#28a745';
  }

  // Preparar datos
  const labels = ['Programadas', 'Completadas', 'Canceladas'];
  const datos = [estados.programada, estados.completada, estados.cancelada];
  const colores = [
    'rgba(54, 162, 235, 0.8)',   // Azul - Programadas
    'rgba(75, 192, 192, 0.8)',   // Verde - Completadas
    'rgba(255, 99, 132, 0.8)'    // Rojo - Canceladas
  ];

  // Destruir gráfica anterior si existe
  if (graficaCancelaciones) {
    graficaCancelaciones.destroy();
  }

  // Crear nueva gráfica de dona
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
          text: 'Distribución de Estados de Citas',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
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

// ========== ACTUALIZAR GRÁFICAS ==========
function actualizarGraficas() {
  cargarGraficas();
}

// ========== INICIALIZAR AL CARGAR LA PÁGINA ==========
document.addEventListener('DOMContentLoaded', () => {
  cargarGraficas();
});