# MyTools

Herramienta interna de gestión para el negocio: arqueo de caja, control de
ventas de fibra, sucursales/empleados y enlaces útiles. Corre como servidor
local (Flask + SQLite) servido en `http://127.0.0.1:5000`, pensada para
uso en una sola máquina, no como servicio expuesto a internet.

## Módulos

- **Arqueo de caja** — carga diaria de caja fuerte / conteo de caja / saldo
  de sistema, con export e import a Excel.
- **Control de fibra** — seguimiento de ventas/instalaciones de fibra por
  vendedor, con export e import a Excel.
- **Sucursal / Empleados** — listado compartido de empleados.
- **Enlaces** — accesos directos a sitios/recursos usados a diario.
- **Configuración** — datos del negocio y clima (usa la API pública de
  [Open-Meteo](https://open-meteo.com/)).

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
