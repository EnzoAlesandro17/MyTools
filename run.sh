#!/bin/bash
# MyTools - lanzador para Linux. Doble-click (o "./run.sh" en una terminal).
set -e
cd "$(dirname "$0")"

if [ ! -d venv ]; then
  echo "Creando entorno virtual..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

( sleep 1.5; xdg-open http://127.0.0.1:5000 2>/dev/null || sensible-browser http://127.0.0.1:5000 2>/dev/null || true ) &

python app.py
