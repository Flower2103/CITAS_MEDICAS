# 🏥 Sistema de Gestión de Citas Médicas

Sistema web para la administración de citas médicas, gestión de pacientes y doctores.

---

## 📦 Instalación

### Requisitos Previos
- Node.js v18+ 
- npm v8+
- Navegador web 

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/sistema-citas-medicas.git
cd sistema-citas-medicas

# 2. Instalar dependencias
cd backend
npm install

# 3. Iniciar el servidor
node server.js
```

El servidor estará disponible en: **http://localhost:3000**

---

## ▶️ Cómo Ejecutar el Proyecto

1. **Iniciar el backend:**
   ```bash
   cd backend
   node server.js
   ```
   Verás: `Servidor corriendo en http://localhost:3000`

2. **Abrir el frontend:**
   - Navega a: `http://localhost:3000` en tu navegador
   - O abre directamente: `frontend/index.html`

---

## 🛠 Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (Flexbox, Grid)
- JavaScript ES6+ (Vanilla)
- Fetch API

### Backend
- Node.js v18+
- Express.js v4.18+
- File System (JSON para persistencia)

---

```
## 📁 Estructura del Proyecto

CITAS_MEDICAS/
├── data/                    
│   ├── citas.json
│   ├── doctores.json
│   └── pacientes.json
│
├── frontend/
│   ├── assets/            
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js          
│   │   ├── citas.js
│   │   ├── doctores.js
│   │   ├── estadisticas.js 
│   │   └── pacientes.js
│   └── pages/
│       ├── index.html
│       ├── citas.html
│       ├── doctores.html
│       ├── estadisticas.html 
│       └── pacientes.html
│
├── node_modules/          
├── utils/                 
├── .gitignore
├── LICENSE
├── package.json            
├── README.md
└── server.js               

```

---

## 📸 Video de Funcionamiento

[🔗] https://drive.google.com/file/d/1xNEsgWeMu1ZigBMrUsfA8tyU1SVzpPEj/view?usp=sharing



## 🎯 Funcionalidades Principales

### Gestión de Pacientes
- ✅ Registro y edición de pacientes
- ✅ Validación de emails y teléfonos únicos
- ✅ Historial médico completo
- ✅ Búsqueda por nombre o ID

### Gestión de Doctores
- ✅ Registro con especialidades y horarios
- ✅ Configuración de días disponibles
- ✅ Visualización de agenda completa
- ✅ Filtro por especialidad

### Gestión de Citas
- ✅ Agendamiento con validación de disponibilidad
- ✅ Búsqueda automática de doctores disponibles
- ✅ Cancelación con modal de confirmación
- ✅ Filtros por fecha, estado y doctor
- ✅ Vista detallada de citas

---

## 🎨 Decisiones de Diseño

### Arquitectura
- **Frontend/Backend separados:** API RESTful con persistencia en JSON
- **Event Delegation:** Manejo eficiente de eventos en elementos dinámicos
- **Modales personalizados:** Mejor UX que alerts nativos del navegador

### Validaciones
Algunas validacions:
- **Emails y teléfonos únicos:** Prevención de duplicados
- **Disponibilidad en tiempo real:** Evita conflictos de horario

### IDs Autoincrementables
- Formato: `P001`, `D001`, `C001`




---

## 🔌 Endpoints 

### Pacientes
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/pacientes` | Listar todos |
| POST | `/pacientes` | Crear nuevo |
| PUT | `/pacientes/:id` | Actualizar |
| GET | `/pacientes/:id/historial` | Ver historial |

### Doctores
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/doctores` | Listar todos |
| POST | `/doctores` | Crear nuevo |
| PUT | `/doctores/:id` | Actualizar |
| GET | `/doctores/:id/citas` | Ver agenda |

### Citas
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/citas` | Listar todas |
| POST | `/citas` | Crear nueva |
| PUT | `/citas/:id/cancelar` | Cancelar |

---

## 🐛 Problemas Encontrados y Soluciones


### Citas No Se Actualizaban Después de Cancelar
**Problema:** Los filtros ocultaban las citas recién canceladas.

**Solución:** Limpiar filtros después de cancelar:
```javascript
filtroFecha.value = "";
filtroEstado.value = "";
filtroDoctor.value = "";
mostrarCitas(listaCitas); // Mostrar todas
```

### Validación de Horarios Incompleta
**Problema:** Citas podían terminar fuera del horario del doctor.

**Solución:** Validar inicio Y fin de la cita:
```javascript
const duracionCita = 60; // minutos
if (minutosCita < minutosInicio || 
    (minutosCita + duracionCita) > minutosFin) {
    return false; // No disponible
}
```

### Solapamiento de Citas
**Problema:** Dos citas podían agendarse si se solapaban parcialmente.

**Solución:** Verificar solapamiento completo:
```javascript
return minutosCita < finCitaExistente && 
       (minutosCita + duracionCita) > inicioCitaExistente;
```

### Fechas con Offset de Timezone
**Problema:** `new Date("2025-12-10")` cambiaba el día por UTC.

**Solución:** Forzar timezone local:
```javascript
new Date("2025-12-10T00:00:00") // Hora local
```



---

## 🌟 Funcionalidades Bonus Implementadas

📊 Dashboard con Gráficas y Estadísticas
Implementado en la página de inicio:

- Gráfica de Citas por Doctor



- Especialidad Más Solicitada



- Estadísticas en Tiempo Real


---

## 👥 Autor

**[Tu Nombre]**
- GitHub: [@Flower2103](https://github.com/tu-usuario)
- Email: al22760045@ite.edu.mx

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

