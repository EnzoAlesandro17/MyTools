-- MyTools: base unica (arqueo de caja + control de fibra)

-- ---------- Arqueo de caja ----------
CREATE TABLE IF NOT EXISTS empleados (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT
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
