def test_index_serves_app_shell(client):
    resp = client.get('/')
    assert resp.status_code == 200


# ---------------------------------------------------------------- empleados

def test_empleados_create_and_list(client):
    resp = client.post('/api/empleados', json={'nombre': 'Juan', 'rol': 'Vendedor'})
    assert resp.status_code == 201
    assert resp.get_json()['nombre'] == 'Juan'

    resp = client.get('/api/empleados')
    assert resp.status_code == 200
    assert [e['nombre'] for e in resp.get_json()] == ['Juan']


def test_empleados_create_dedupes_by_name_case_insensitive(client):
    client.post('/api/empleados', json={'nombre': 'Juan'})
    resp = client.post('/api/empleados', json={'nombre': 'juan'})
    assert resp.status_code == 200

    resp = client.get('/api/empleados')
    assert len(resp.get_json()) == 1


def test_empleados_create_requires_nombre(client):
    resp = client.post('/api/empleados', json={'nombre': ''})
    assert resp.status_code == 400


def test_empleados_delete(client):
    created = client.post('/api/empleados', json={'nombre': 'Juan'}).get_json()
    resp = client.delete(f"/api/empleados/{created['id']}")
    assert resp.status_code == 204
    assert client.get('/api/empleados').get_json() == []


# ------------------------------------------------------------------ arqueo

def test_arqueo_create_computes_resultado(client):
    payload = {
        'fecha': '2026-07-23T10:00:00',
        'empleados': ['Juan'],
        'cf': '1000',
        'cc': '500',
        'sc': '200',
    }
    resp = client.post('/api/arqueo/registros', json=payload)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['resultado'] == 1300.0
    assert body['empleados'] == ['Juan']


def test_arqueo_create_requires_fecha_and_empleados(client):
    resp = client.post('/api/arqueo/registros', json={'fecha': '', 'empleados': []})
    assert resp.status_code == 400


def test_arqueo_delete_is_soft(client):
    created = client.post(
        '/api/arqueo/registros',
        json={'fecha': '2026-07-23T10:00:00', 'empleados': ['Juan'], 'cf': '0', 'cc': '0', 'sc': '0'},
    ).get_json()

    resp = client.delete(f"/api/arqueo/registros/{created['id']}")
    assert resp.status_code == 204

    resp = client.get('/api/arqueo/registros')
    assert resp.get_json() == []


# ------------------------------------------------------------------- fibra

def test_fibra_planes_create_and_dedupe(client):
    resp = client.post('/api/fibra/planes', json={'mb': 300})
    assert resp.status_code == 201

    resp = client.post('/api/fibra/planes', json={'mb': 300})
    assert resp.status_code == 200

    assert len(client.get('/api/fibra/planes').get_json()) == 1


def test_fibra_planes_create_rejects_invalid_mb(client):
    resp = client.post('/api/fibra/planes', json={'mb': 'abc'})
    assert resp.status_code == 400

    resp = client.post('/api/fibra/planes', json={'mb': -5})
    assert resp.status_code == 400


def test_fibra_ventas_create_requires_fields(client):
    resp = client.post('/api/fibra/ventas', json={'vendedor': 'Juan'})
    assert resp.status_code == 400


def test_fibra_ventas_create_update_delete(client):
    payload = {'vendedor': 'Juan', 'fechaIngreso': '2026-07-23', 'clienteNombre': 'Cliente Uno'}
    created = client.post('/api/fibra/ventas', json=payload).get_json()
    assert created['vendedor'] == 'Juan'

    updated = client.put(
        f"/api/fibra/ventas/{created['id']}",
        json={**payload, 'clienteNombre': 'Cliente Dos'},
    ).get_json()
    assert updated['clienteNombre'] == 'Cliente Dos'

    resp = client.delete(f"/api/fibra/ventas/{created['id']}")
    assert resp.status_code == 204
    assert client.get('/api/fibra/ventas').get_json() == []


# ----------------------------------------------------------------- enlaces

def test_enlaces_create_normalizes_url(client):
    resp = client.post('/api/enlaces', json={'titulo': 'Google', 'url': 'google.com'})
    assert resp.status_code == 201
    assert resp.get_json()['url'] == 'https://google.com'


def test_enlaces_create_requires_titulo_and_url(client):
    resp = client.post('/api/enlaces', json={'titulo': '', 'url': ''})
    assert resp.status_code == 400


# ----------------------------------------------------------------- config

def test_config_get_returns_defaults(client):
    resp = client.get('/api/config')
    assert resp.status_code == 200
    assert resp.get_json()['nombre_negocio'] == 'MyTools'


def test_config_put_overrides_values(client):
    resp = client.put('/api/config', json={'nombre_negocio': 'Panacar'})
    assert resp.status_code == 200
    assert resp.get_json()['nombre_negocio'] == 'Panacar'

    resp = client.get('/api/config')
    assert resp.get_json()['nombre_negocio'] == 'Panacar'
