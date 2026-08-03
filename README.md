# MyTools

Herramienta interna de gestión para el negocio: arqueo de caja, control de
ventas de fibra, sucursales/empleados y enlaces útiles. Corre como servidor
local (Flask + SQLite) servido en `http://127.0.0.1:5000`, pensada para
uso en una sola máquina, no como servicio expuesto a internet.

## Módulos

- **Tareas** — seguimiento de tareas internas: título, fecha máxima y
  marca de prioridad (borde rojo + etiqueta "Prioritaria"). Cada tarea
  lleva un registro de avances con fecha y hora; la tarjeta muestra los
  últimos 5 y hay un modal para ver el historial completo. Se puede
  cerrar una tarea (deja de aceptar avances).
- **Arqueo de caja** — carga diaria de caja fuerte / conteo de caja / saldo
  de sistema, con export e import a Excel. Editar y eliminar un arqueo
  cargado está deshabilitado a propósito (para evitar ediciones de mala fe);
  el código sigue en `modules/arqueo-caja/arqueo.js` comentado, listo para
  reactivarse cuando exista un rol admin.
- **Control de fibra** — seguimiento de ventas/instalaciones de fibra por
  vendedor, con export e import a Excel.
- **Enlaces** — accesos directos a sitios/recursos usados a diario.
- **Configuración** — sucursales, empleados, unidades y ciudad del clima
  (usa la API pública de [Open-Meteo](https://open-meteo.com/)), y
  export/import de Arqueo y Fibra. Se accede desde el ícono de tuerca
  en el encabezado, no tiene tarjeta propia en Inicio.

## Requisitos

- Python 3.10+

## Uso

```bash
./run.sh      # Linux/macOS
run.bat       # Windows
```

Esto crea un entorno virtual en `venv/`, instala dependencias y abre
`http://127.0.0.1:5000` en el navegador. Los datos se guardan en
`data/mytools.db` (SQLite), creada automáticamente en el primer arranque.

## Tests

```bash
python -m venv venv && source venv/bin/activate   # si no existe todavía
pip install -r requirements-dev.txt
python -m pytest
```

Los tests usan una base SQLite temporal (no tocan `data/mytools.db`) y
cubren las funciones de parseo/formato y los endpoints principales de la
API.

## Estructura

```
app.py              Servidor Flask + API REST
schema.sql           Definición de la base SQLite
app.html             Shell de la SPA
modules/<nombre>/    Un módulo JS por feature (sin build step)
shared/               CSS y JS comunes a todos los módulos
tests/                Suite de tests (pytest)
```
