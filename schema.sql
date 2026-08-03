-- MyTools: base unica (arqueo de caja + control de fibra)

-- ---------- Configuracion / General ----------
CREATE TABLE IF NOT EXISTS sucursales (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_interno TEXT,
  direccion TEXT
);

-- ---------- Arqueo de caja ----------
CREATE TABLE IF NOT EXISTS empleados (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT,
  dni TEXT,
  telefono TEXT,
  email TEXT,
  codigo_interno TEXT
);

CREATE TABLE IF NOT EXISTS arqueos (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  cf_expr TEXT,
  cf_val REAL,
  cc_expr TEXT,
  cc_val REAL,
  sc_expr TEXT,
  sc_val REAL,
  resultado REAL,
  eliminado INTEGER NOT NULL DEFAULT 0
);

-- Snapshot del nombre del empleado al momento del arqueo (desacoplado de
-- "empleados": si se renombra/borra un empleado en Configuracion, los
-- arqueos ya cargados no cambian, igual que en la app anterior).
CREATE TABLE IF NOT EXISTS arqueo_empleados (
  arqueo_id TEXT NOT NULL REFERENCES arqueos(id),
  nombre TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_arqueo_empleados_arqueo_id ON arqueo_empleados(arqueo_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_fecha ON arqueos(fecha);

-- ---------- Control de fibra ----------
-- Los vendedores son parte del mismo listado de "empleados" (ver arriba);
-- no tienen tabla propia.
CREATE TABLE IF NOT EXISTS planes (
  id TEXT PRIMARY KEY,
  mb INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas (
  id TEXT PRIMARY KEY,
  vendedor TEXT,
  fecha_ingreso TEXT,
  plan INTEGER,
  cantidad_tv INTEGER,
  fecha_pactada TEXT,
  franja_pactada TEXT,
  ot TEXT,
  sds TEXT,
  fecha_instalacion TEXT,
  estado TEXT,
  con_form INTEGER DEFAULT 0,
  observaciones TEXT,
  cliente_nombre TEXT,
  dni TEXT,
  fecha_nacimiento TEXT,
  email TEXT,
  telefono TEXT,
  telefono_alt TEXT,
  localidad TEXT,
  calle TEXT,
  altura TEXT,
  entre_calles TEXT,
  tipo_domicilio TEXT,
  torre_piso_depto TEXT,
  orden INTEGER,
  created_at INTEGER,
  updated_at INTEGER,
  eliminado INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_ingreso ON ventas(fecha_ingreso);

-- ---------- Tareas ----------
CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  fecha_limite TEXT,
  prioritaria INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'abierta',
  created_at INTEGER NOT NULL,
  closed_at INTEGER
);

CREATE TABLE IF NOT EXISTS tarea_comentarios (
  id TEXT PRIMARY KEY,
  tarea_id TEXT NOT NULL REFERENCES tareas(id),
  texto TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tarea_comentarios_tarea_id ON tarea_comentarios(tarea_id);
CREATE INDEX IF NOT EXISTS idx_tareas_created_at ON tareas(created_at);

-- ---------- Enlaces utiles ----------
CREATE TABLE IF NOT EXISTS enlaces (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  created_at INTEGER
);

-- ---------- Configuracion global (clave/valor) ----------
CREATE TABLE IF NOT EXISTS config_global (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

-- ---------- Horarios ----------
-- Cada semana es independiente: no existe una plantilla "general", hay que
-- cargar el horario semana a semana. Un solo registro por empleado/dia/semana
-- (el indice unico que lo garantiza se crea en la migracion, para no romper
-- instalaciones existentes al actualizar).
-- tipo: 'horario' (usa hora_inicio/hora_fin), 'licencia', 'franco', u 'otro'
-- (nota libre, sin hora_inicio/hora_fin).
-- dia_semana: 0=lunes .. 6=domingo. semana: 'YYYY-Wnn' (ISO).
CREATE TABLE IF NOT EXISTS horarios (
  id TEXT PRIMARY KEY,
  empleado_id TEXT NOT NULL REFERENCES empleados(id),
  dia_semana INTEGER NOT NULL,
  semana TEXT NOT NULL,
  tipo TEXT NOT NULL,
  hora_inicio TEXT,
  hora_fin TEXT,
  nota TEXT
);
CREATE INDEX IF NOT EXISTS idx_horarios_empleado_dia ON horarios(empleado_id, dia_semana);

-- Orden y visibilidad de empleados en la grilla de Horarios: independiente
-- del orden alfabetico de Configuracion. Permite ocultar a alguien (p.ej. un
-- supervisor que no tiene horario de vendedor) sin borrarlo de Empleados.
CREATE TABLE IF NOT EXISTS horario_empleados (
  empleado_id TEXT PRIMARY KEY REFERENCES empleados(id),
  orden INTEGER NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1
);
