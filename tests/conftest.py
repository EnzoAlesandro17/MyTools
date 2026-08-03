import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

import app as app_module


@pytest.fixture
def client(tmp_path, monkeypatch):
    """Flask test client backed by a fresh SQLite db per test."""
    monkeypatch.setattr(app_module, 'DATA_DIR', tmp_path)
    monkeypatch.setattr(app_module, 'DB_PATH', tmp_path / 'test.db')
    app_module.init_db()
    app_module.app.config['TESTING'] = True
    with app_module.app.test_client() as test_client:
        yield test_client
