@echo off
REM MyTools - lanzador para Windows. Doble-click sobre este archivo.
cd /d "%~dp0"

if not exist venv (
  echo Creando entorno virtual...
  python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt

start "" http://127.0.0.1:5000
python app.py

pause
