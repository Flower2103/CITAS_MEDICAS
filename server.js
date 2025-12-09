const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const app = express();


app.use(express.json());

// Servir carpeta frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Servir carpeta data
app.use("/data", express.static(path.join(__dirname, "data")));


// ------------------ FUNCIONES AUXILIARES ------------------

async function readJSON(filename) {
  const data = await fs.readFile(filename, "utf8");
  return JSON.parse(data);
}

async function writeJSON(filename, data) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2), "utf8");
}

// ------------------ PACIENTES ------------------

// POST /pacientes - Registrar nuevo paciente
app.post("/pacientes", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const nuevo = req.body;

    // Validar datos obligatorios 
    if (
      nuevo.nombre == null ||
      nuevo.edad == null ||
      nuevo.telefono == null ||
      nuevo.email == null
    ) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Verificar email único
    if (pacientes.some(p => p.email === nuevo.email)) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Validar edad positiva
    if (nuevo.edad <= 0) {
      return res.status(400).json({ error: "La edad debe ser mayor a 0" });
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nuevo.nombre)) {
      return res.status(400).json({ error: "El nombre solo puede contener letras y espacios" });
    }
    if (!/^\d{10,}$/.test(nuevo.telefono)) {
      return res.status(400).json({ error: "Teléfono inválido. Solo números y mínimo 10 dígitos" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo.email)) {
    return res.status(400).json({ error: "Email inválido" });
    }


    // ------------------------------
    // GENERAR ID AUTOINCREMENTABLE
    // ------------------------------
    const ultimoId = pacientes.length > 0
      ? Math.max(...pacientes.map(p => parseInt(p.id.replace("P",""))))
      : 0;

    nuevo.id = "P" + String(ultimoId + 1).padStart(3, "0");
    // ------------------------------

    nuevo.fechaRegistro = new Date().toISOString().split("T")[0];

    pacientes.push(nuevo);
    await writeJSON("./data/pacientes.json", pacientes);

    res.status(201).json(nuevo);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar paciente" });
  }
});

// GET /pacientes - Listar todos
app.get("/pacientes", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    res.json(pacientes);
  } catch {
    res.status(500).json({ error: "Error al leer pacientes" });
  }
});


// GET /pacientes/:id - Obtener por ID
app.get("/pacientes/:id", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const paciente = pacientes.find(p => p.id === req.params.id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });
    res.json(paciente);
  } catch {
    res.status(500).json({ error: "Error al leer paciente" });
  }
});

// PUT /pacientes/:id - Actualizar datos
app.put("/pacientes/:id", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const idx = pacientes.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });

    const { id, ...actualizaciones } = req.body; // bloqueamos cambios de id
    //VALIDACIONES
    if (actualizaciones.edad && actualizaciones.edad <= 0) {
      return res.status(400).json({ error: "La edad debe ser mayor a 0" });
    }
    if (actualizaciones.nombre && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(actualizaciones.nombre)) {
      return res.status(400).json({ error: "El nombre solo puede contener letras y espacios" });
    }
    if (actualizaciones.telefono && !/^\d{10,}$/.test(actualizaciones.telefono)) {
      return res.status(400).json({ error: "Teléfono inválido. Solo números y mínimo 10 dígitos" });
    }
    if (actualizaciones.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actualizaciones.email)) {
        return res.status(400).json({ error: "Email inválido" });
      }
      // Verificar duplicado en otros pacientes
      const duplicado = pacientes.find(p => p.email === actualizaciones.email && p.id !== req.params.id);
      if (duplicado) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }
    }


    pacientes[idx] = { ...pacientes[idx], ...actualizaciones };
    await writeJSON("./data/pacientes.json", pacientes);
    res.json(pacientes[idx]);
  } catch {
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
});

// GET /pacientes/:id/historial - Ver historial de citas
app.get("/pacientes/:id/historial", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const paciente = pacientes.find(p => p.id === req.params.id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const citas = await readJSON("./data/citas.json");
    const historial = citas.filter(c => c.pacienteId === req.params.id);

    if (historial.length === 0) {
      return res.json({ mensaje: "No hay historial de citas" });
    }

    res.json(historial);
  } catch {
    res.status(500).json({ error: "Error al leer historial" });
  }
});


// ------------------ DOCTORES ------------------

// Días válidos
const DIAS_VALIDOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];


// POST /doctores - Registrar nuevo doctor
app.post("/doctores", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const nuevo = req.body;

    //DEBUG: Ver que llega exactamente
   /* 
   console.log("===== DEBUG SERVER.JS =====");
    console.log("Body recibido:", JSON.stringify(nuevo, null, 2));
    console.log("nombre:", nuevo.nombre, "| tipo:", typeof nuevo.nombre, "| existe?", !!nuevo.nombre);
    console.log("especialidad:", nuevo.especialidad, "| tipo:", typeof nuevo.especialidad, "| existe?", !!nuevo.especialidad);
    console.log("horarioInicio:", nuevo.horarioInicio, "| tipo:", typeof nuevo.horarioInicio, "| existe?", !!nuevo.horarioInicio);
    console.log("horarioFin:", nuevo.horarioFin, "| tipo:", typeof nuevo.horarioFin, "| existe?", !!nuevo.horarioFin);
    console.log("diasDisponibles:", nuevo.diasDisponibles, "| tipo:", typeof nuevo.diasDisponibles, "| es array?", Array.isArray(nuevo.diasDisponibles), "| length:", nuevo.diasDisponibles?.length);
    console.log("===========================");
    */

    //Validar datos obligatorios (sin id, se genera automaticamente)
    if (!nuevo.nombre || !nuevo.especialidad || !nuevo.horarioInicio || !nuevo.horarioFin || !nuevo.diasDisponibles) {
      console.log("❌ Validación falló: Faltan datos obligatorios");
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    //Validar que diasDisponibles sea un array no vacio
    if (!Array.isArray(nuevo.diasDisponibles) || nuevo.diasDisponibles.length === 0) {
      console.log("❌ Validación falló: diasDisponibles no es array o está vacío");
      return res.status(400).json({ error: "Debe especificar al menos un día disponible" });
    }

    //Validar que todos los días sean validos
    const DIAS_VALIDOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const diasInvalidos = nuevo.diasDisponibles.filter(d => !DIAS_VALIDOS.includes(d));
    if (diasInvalidos.length > 0) {
      console.log("❌ Validación falló: Días inválidos:", diasInvalidos);
      return res.status(400).json({ error: `Días inválidos: ${diasInvalidos.join(", ")}` });
    }

    //Validar duplicado
    if (doctores.some(d => d.nombre === nuevo.nombre && d.especialidad === nuevo.especialidad)) {
      console.log("❌ Validación falló: Doctor duplicado");
      return res.status(400).json({ error: "Ya existe un doctor con ese nombre y especialidad" });
    }

    //Validar horario
    if (nuevo.horarioInicio >= nuevo.horarioFin) {
      console.log("❌ Validación falló: Horario inválido");
      return res.status(400).json({ error: "El horario de inicio debe ser menor al fin" });
    }

    //ID AUTOINCREMENTABLE
    const ultimoId = doctores.length > 0
      ? Math.max(...doctores.map(d => parseInt(d.id.replace("D", ""))))
      : 0;

    nuevo.id = "D" + String(ultimoId + 1).padStart(3, "0");
    console.log("✅ ID generado:", nuevo.id);
    // ------------------------------

    doctores.push(nuevo);
    await writeJSON("./data/doctores.json", doctores);
    console.log("✅ Doctor guardado exitosamente");
    res.status(201).json(nuevo);
    
  } catch (err) {
    console.error("❌ Error en catch:", err);
    res.status(500).json({ error: "Error al registrar doctor" });
  }
});


// GET /doctores - Listar todos
app.get("/doctores", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    res.json(doctores);
  } catch {
    res.status(500).json({ error: "Error al leer doctores" });
  }
});

// GET /doctores/especialidad/:esp - Buscar por especialidad
app.get("/doctores/especialidad/:esp", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const filtrados = doctores.filter(d => d.especialidad.toLowerCase() === req.params.esp.toLowerCase());
    res.json(filtrados);
  } catch {
    res.status(500).json({ error: "Error al buscar doctores" });
  }
});

// GET /doctores/:id - Obtener por ID
app.get("/doctores/:id", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const doctor = doctores.find(d => d.id === req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor no encontrado" });
    res.json(doctor);
  } catch {
    res.status(500).json({ error: "Error al leer doctor" });
  }
});

// GET /doctores/:id/citas - Obtener agenda del doctor
app.get("/doctores/:id/citas", async (req, res) => {
  try {
    const doctorId = req.params.id;

    const doctores = await readJSON("./data/doctores.json");
    const citas = await readJSON("./data/citas.json");
    const pacientes = await readJSON("./data/pacientes.json");

    const doctor = doctores.find(d => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    // Filtrar citas del doctor
    const agenda = citas
      .filter(c => c.doctorId === doctorId)
      .map(c => ({
        ...c,
        pacienteNombre: pacientes.find(p => p.id === c.pacienteId)?.nombre || "—"
      }));

    res.json(agenda);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener citas del doctor" });
  }
});

// PUT /doctores/:id - Actualizar datos de doctor
app.put("/doctores/:id", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const idx = doctores.findIndex(d => d.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    const { id, ...actualizaciones } = req.body; // No permitir cambio de ID

    // Validar diasDisponibles si viene en la actualización
    if (actualizaciones.diasDisponibles) {
      if (!Array.isArray(actualizaciones.diasDisponibles) || actualizaciones.diasDisponibles.length === 0) {
        return res.status(400).json({ error: "Debe especificar al menos un día disponible" });
      }

      const DIAS_VALIDOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const diasInvalidos = actualizaciones.diasDisponibles.filter(d => !DIAS_VALIDOS.includes(d));
      if (diasInvalidos.length > 0) {
        return res.status(400).json({ error: `Días inválidos: ${diasInvalidos.join(", ")}` });
      }
    }

    // Validar horario si viene en la actualización
    const horarioInicio = actualizaciones.horarioInicio || doctores[idx].horarioInicio;
    const horarioFin = actualizaciones.horarioFin || doctores[idx].horarioFin;
    
    if (horarioInicio >= horarioFin) {
      return res.status(400).json({ error: "El horario de inicio debe ser menor al fin" });
    }

    // Validar duplicado (solo si cambia nombre o especialidad)
    if (actualizaciones.nombre || actualizaciones.especialidad) {
      const nombreFinal = actualizaciones.nombre || doctores[idx].nombre;
      const especialidadFinal = actualizaciones.especialidad || doctores[idx].especialidad;
      
      const duplicado = doctores.find(d => 
        d.nombre === nombreFinal && 
        d.especialidad === especialidadFinal && 
        d.id !== req.params.id
      );
      
      if (duplicado) {
        return res.status(400).json({ error: "Ya existe un doctor con ese nombre y especialidad" });
      }
    }

    // Actualizar doctor
    doctores[idx] = { ...doctores[idx], ...actualizaciones };
    await writeJSON("./data/doctores.json", doctores);
    
    res.json(doctores[idx]);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar doctor" });
  }
});

//GET - DOCTORES DISONIBLES
app.get("/doctores/disponibles", async (req, res) => {
  try {
    const { fecha, hora } = req.query;
    if (!fecha || !hora) return res.status(400).json({ error: "Falta fecha u hora" });

    const doctores = await readJSON("./data/doctores.json");
    const citas = await readJSON("./data/citas.json");

    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const diaCita = dias[new Date(fecha).getDay()];

    const disponibles = doctores.filter(d => {
      if (!d.diasDisponibles.includes(diaCita)) return false;

      const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
      const [hFin, mFin] = d.horarioFin.split(":").map(Number);
      const [hCita, mCita] = hora.split(":").map(Number);

      const minutosInicio = hInicio*60 + mInicio;
      const minutosFin = hFin*60 + mFin;
      const minutosCita = hCita*60 + mCita;

      if (minutosCita < minutosInicio || minutosCita >= minutosFin) return false;

      const ocupada = citas.some(c => 
        c.doctorId === d.id &&
        new Date(c.fecha).toISOString().split("T")[0] === fecha &&
        c.hora === hora
      );

      return !ocupada;
    });

    res.json(disponibles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener doctores disponibles" });
  }
});

// ------------------ CITAS ------------------

// POST /citas - CREAR
app.post("/citas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const pacientes = await readJSON("./data/pacientes.json");
    const doctores = await readJSON("./data/doctores.json");
    const nueva = req.body;

    // Generación de ID autonumérico
    const lastCita = citas[citas.length - 1];
    let newIdNumber = 1;

    if (lastCita) {
      const lastIdMatch = lastCita.id.match(/C(\d+)/);
      if (lastIdMatch) {
        newIdNumber = parseInt(lastIdMatch[1]) + 1;
      }
    }
    
    nueva.id = "C" + String(newIdNumber).padStart(3, '0');
    
    // Validar campos obligatorios
    if (!nueva.pacienteId || !nueva.doctorId || !nueva.fecha || !nueva.hora) {
      return res.status(400).json({ error: "Faltan datos obligatorios (pacienteId, doctorId, fecha, hora)" });
    }

    // Validar que existan paciente y doctor (comparar como strings)
    const paciente = pacientes.find(p => String(p.id) === String(nueva.pacienteId));
    if (!paciente) {
      return res.status(400).json({ error: "El paciente no existe" });
    }

    const doctor = doctores.find(d => String(d.id) === String(nueva.doctorId));
    if (!doctor) {
      return res.status(400).json({ error: "El doctor no existe" });
    }

    // Validar fecha y hora futura
    const fechaCita = new Date(`${nueva.fecha}T${nueva.hora}`);
    const ahora = new Date();
    if (fechaCita <= ahora) {
      return res.status(400).json({ error: "La fecha y hora deben ser futuras" });
    }

    // Validar que el doctor esté disponible ese día
    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const diaCita = dias[fechaCita.getDay()];
    if (!doctor.diasDisponibles.includes(diaCita)) {
      return res.status(400).json({ error: `El doctor no está disponible el día ${diaCita}` });
    }

    // Validar hora dentro del horario del doctor
    const [hInicio, mInicio] = doctor.horarioInicio.split(":").map(Number);
    const [hFin, mFin] = doctor.horarioFin.split(":").map(Number);
    const [hCita, mCita] = nueva.hora.split(":").map(Number);

    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFin = hFin * 60 + mFin;
    const minutosCita = hCita * 60 + mCita;
    const duracionCita = 60; // 60 minutos por cita

    // La cita debe INICIAR dentro del horario Y TERMINAR antes del cierre
    if (minutosCita < minutosInicio) {
      return res.status(400).json({ 
        error: `La cita es demasiado temprano. El doctor inicia a las ${doctor.horarioInicio}` 
      });
    }

    if ((minutosCita + duracionCita) > minutosFin) {
      return res.status(400).json({ 
        error: `La cita terminaría después del horario. El doctor termina a las ${doctor.horarioFin}` 
      });
    }

    // Validar disponibilidad: no debe haber otra cita a la misma hora
    const fechaStr = fechaCita.toISOString().split("T")[0];
    
    // Buscar si hay conflicto con otra cita
    const conflicto = citas.find(c => {
      // Solo citas del mismo doctor
      if (String(c.doctorId) !== String(nueva.doctorId)) return false;
      
      // Solo citas programadas (no canceladas)
      if (c.estado !== "programada") return false;
      
      // Solo citas del mismo día
      const fechaCitaExistente = new Date(c.fecha).toISOString().split("T")[0];
      if (fechaCitaExistente !== fechaStr) return false;

      // Verificar solapamiento de horarios
      const [hc, mc] = c.hora.split(":").map(Number);
      const inicioCitaExistente = hc * 60 + mc;
      const finCitaExistente = inicioCitaExistente + duracionCita;

      const inicioCitaNueva = minutosCita;
      const finCitaNueva = minutosCita + duracionCita;

      // Hay conflicto si se solapan
      return inicioCitaNueva < finCitaExistente && finCitaNueva > inicioCitaExistente;
    });

    if (conflicto) {
      return res.status(400).json({ 
        error: `El doctor ya tiene una cita programada que genera conflicto (Cita #${conflicto.id} a las ${conflicto.hora})` 
      });
    }

    // Guardar cita
    nueva.estado = "programada";
    citas.push(nueva);
    await writeJSON("./data/citas.json", citas);
    
    res.status(201).json(nueva);

  } catch (err) {
    console.error("Error al crear cita:", err);
    res.status(500).json({ error: "Error al crear cita" });
  }
});

// GET /citas - Ver todas las citas
app.get("/citas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");

    if (citas.length === 0) {
      return res.json({ mensaje: "No hay citas registradas" });
    }

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer las citas" });
  }
});

// GET /citas/proximas - Citas en las próximas 24 horas
app.get("/citas/proximas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const proximas = citas.filter(c => {
      const fechaCita = new Date(`${c.fecha}T${c.hora}`);
      return c.estado === "programada" && fechaCita >= ahora && fechaCita <= fin;
    });

    res.json(proximas);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener citas próximas" });
  }
});

// GET /citas/:id - Obtener cita por ID
app.get("/citas/:id", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const cita = citas.find(c => c.id === req.params.id);
    
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.json(cita);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer la cita" });
  }
});

// PUT /citas/:id/cancelar - Cancelar una cita
app.put("/citas/:id/cancelar", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const idx = citas.findIndex(c => c.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (citas[idx].estado !== "programada") {
      return res.status(400).json({ error: "Solo se pueden cancelar citas programadas" });
    }

    citas[idx].estado = "cancelada";
    await writeJSON("./data/citas.json", citas);

    res.json(citas[idx]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cancelar cita" });
  }
});

// GET /doctores/disponibles - Buscar doctores disponibles
app.get("/doctores/disponibles", async (req, res) => {
  try {
    const { fecha, hora } = req.query;
    
    if (!fecha || !hora) {
      return res.status(400).json({ error: "Falta fecha u hora" });
    }

    const doctores = await readJSON("./data/doctores.json");
    const citas = await readJSON("./data/citas.json");

    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaCita = dias[fechaObj.getDay()];

    const [hCita, mCita] = hora.split(":").map(Number);
    const minutosCita = hCita * 60 + mCita;
    const duracionCita = 60;

    const disponibles = doctores.filter(d => {
      // 1. Doctor disponible ese día
      if (!d.diasDisponibles.includes(diaCita)) return false;

      // 2. Hora dentro del rango del doctor
      const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
      const [hFin, mFin] = d.horarioFin.split(":").map(Number);
      const minutosInicio = hInicio * 60 + mInicio;
      const minutosFin = hFin * 60 + mFin;

      // La cita debe INICIAR dentro del horario Y TERMINAR antes del cierre
      if (minutosCita < minutosInicio || (minutosCita + duracionCita) > minutosFin) {
        return false;
      }

      // 3. Verificar disponibilidad - no debe haber conflictos
      const ocupado = citas.some(c => {
        if (String(c.doctorId) !== String(d.id)) return false;
        if (c.estado !== "programada") return false;
        
        const fechaCitaStr = new Date(c.fecha + 'T00:00:00').toISOString().split("T")[0];
        const fechaBusquedaStr = fechaObj.toISOString().split("T")[0];
        
        if (fechaCitaStr !== fechaBusquedaStr) return false;

        const [hc, mc] = c.hora.split(":").map(Number);
        const inicioCitaExistente = hc * 60 + mc;
        const finCitaExistente = inicioCitaExistente + duracionCita;

        // Verificar solapamiento
        return minutosCita < finCitaExistente && (minutosCita + duracionCita) > inicioCitaExistente;
      });

      return !ocupado;
    });

    res.json(disponibles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar doctores disponibles" });
  }
});
//------------------Funcionalidades extras --------------------
// GET /estadisticas/doctores
app.get("/estadisticas/doctores", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const doctores = await readJSON("./data/doctores.json");

    const conteo = {};
    doctores.forEach(d => { conteo[d.id] = 0; }); // Inicializa todos en 0

    citas.forEach(c => {
      if (c.estado === "programada" && conteo[c.doctorId] !== undefined) {
        conteo[c.doctorId] += 1;
      }
    });

    // Mapear a un array de doctores con sus citas
    const resultado = doctores.map(d => ({
      doctor: d,
      citas: conteo[d.id]
    }));

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al calcular estadísticas" });
  }
});


// GET /estadisticas/especialidades
app.get("/estadisticas/especialidades", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const doctores = await readJSON("./data/doctores.json");

    const conteo = {};
    citas.forEach(c => {
      if (c.estado === "programada") {
        const doctor = doctores.find(d => d.id === c.doctorId);
        if (doctor) {
          conteo[doctor.especialidad] = (conteo[doctor.especialidad] || 0) + 1;
        }
      }
    });

    let maxSolicitada = null;
    let maxCitas = 0;
    for (const [esp, cant] of Object.entries(conteo)) {
      if (cant > maxCitas) {
        maxCitas = cant;
        maxSolicitada = esp;
      }
    }

    res.json({
      especialidad: maxSolicitada,
      citas: maxCitas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al calcular especialidad más solicitada" });
  }
});


// ------------------ INICIO DEL SERVIDOR ------------------

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
