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


def test_empleados_create_with_extra_fields(client):
    resp = client.post('/api/empleados', json={
        'nombre': 'Juan', 'apellido': 'Pérez', 'dni': '30111222',
        'telefono': '3411234567', 'email': 'juan@test.com', 'codigoInterno': 'EMP1',
    })
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['apellido'] == 'Pérez'
    assert body['codigoInterno'] == 'EMP1'
    assert 'rol' not in body


def test_empleados_dedupe_allows_same_name_different_apellido(client):
    client.post('/api/empleados', json={'nombre': 'Juan', 'apellido': 'Pérez'})
    resp = client.post('/api/empleados', json={'nombre': 'Juan', 'apellido': 'Gómez'})
    assert resp.status_code == 201
    assert len(client.get('/api/empleados').get_json()) == 2


# ---------------------------------------------------------------- sucursales

def test_sucursales_create_and_list(client):
    resp = client.post('/api/sucursales', json={
        'nombre': 'Casa Central', 'codigoInterno': 'CC1', 'direccion': 'San Martín 123',
    })
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['nombre'] == 'Casa Central'
    assert body['direccion'] == 'San Martín 123'

    resp = client.get('/api/sucursales')
    assert [s['nombre'] for s in resp.get_json()] == ['Casa Central']


def test_sucursales_create_requires_nombre(client):
    resp = client.post('/api/sucursales', json={'nombre': ''})
    assert resp.status_code == 400


def test_sucursales_delete(client):
    created = client.post('/api/sucursales', json={'nombre': 'Casa Central'}).get_json()
    resp = client.delete(f"/api/sucursales/{created['id']}")
    assert resp.status_code == 204
    assert client.get('/api/sucursales').get_json() == []


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


# ------------------------------------------------------------------ tareas

def test_tareas_create_and_list(client):
    resp = client.post('/api/tareas', json={'titulo': 'Renovar contrato', 'fechaLimite': '2026-09-01'})
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['titulo'] == 'Renovar contrato'
    assert body['estado'] == 'abierta'
    assert body['prioritaria'] is False
    assert body['comentarios'] == []

    resp = client.get('/api/tareas')
    assert resp.status_code == 200
    assert [t['titulo'] for t in resp.get_json()] == ['Renovar contrato']


def test_tareas_create_requires_titulo(client):
    resp = client.post('/api/tareas', json={'titulo': ''})
    assert resp.status_code == 400


def test_tareas_list_ordered_oldest_first(client):
    client.post('/api/tareas', json={'titulo': 'Primera'})
    client.post('/api/tareas', json={'titulo': 'Segunda'})
    resp = client.get('/api/tareas')
    assert [t['titulo'] for t in resp.get_json()] == ['Primera', 'Segunda']


def test_tareas_toggle_prioridad(client):
    created = client.post('/api/tareas', json={'titulo': 'Urgente'}).get_json()
    resp = client.put(f"/api/tareas/{created['id']}/prioridad")
    assert resp.status_code == 200
    assert resp.get_json()['prioritaria'] is True

    resp = client.put(f"/api/tareas/{created['id']}/prioridad")
    assert resp.get_json()['prioritaria'] is False


def test_tareas_comentarios_create_and_preview(client):
    created = client.post('/api/tareas', json={'titulo': 'Con avances'}).get_json()
    for i in range(7):
        resp = client.post(f"/api/tareas/{created['id']}/comentarios", json={'texto': f'avance {i}'})
        assert resp.status_code == 201

    tarea = resp.get_json()
    assert tarea['comentariosCount'] == 7
    assert len(tarea['comentarios']) == 5
    assert tarea['comentarios'][0]['texto'] == 'avance 6'  # mas reciente primero

    resp = client.get(f"/api/tareas/{created['id']}/comentarios")
    assert len(resp.get_json()) == 7


def test_tareas_comentarios_requires_texto(client):
    created = client.post('/api/tareas', json={'titulo': 'Sin avances'}).get_json()
    resp = client.post(f"/api/tareas/{created['id']}/comentarios", json={'texto': ''})
    assert resp.status_code == 400


def test_tareas_cerrar(client):
    created = client.post('/api/tareas', json={'titulo': 'A cerrar'}).get_json()
    resp = client.post(f"/api/tareas/{created['id']}/cerrar")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['estado'] == 'cerrada'
    assert body['closedAt'] is not None


def test_tareas_cerrar_ya_cerrada_falla(client):
    created = client.post('/api/tareas', json={'titulo': 'A cerrar'}).get_json()
    client.post(f"/api/tareas/{created['id']}/cerrar")
    resp = client.post(f"/api/tareas/{created['id']}/cerrar")
    assert resp.status_code == 400


def test_tareas_reabrir(client):
    created = client.post('/api/tareas', json={'titulo': 'A reabrir'}).get_json()
    client.post(f"/api/tareas/{created['id']}/cerrar")
    resp = client.post(f"/api/tareas/{created['id']}/reabrir")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['estado'] == 'abierta'
    assert body['closedAt'] is None

    # una vez reabierta, se pueden volver a agregar avances
    resp = client.post(f"/api/tareas/{created['id']}/comentarios", json={'texto': 'de nuevo activa'})
    assert resp.status_code == 201


def test_tareas_reabrir_si_no_esta_cerrada_falla(client):
    created = client.post('/api/tareas', json={'titulo': 'Abierta'}).get_json()
    resp = client.post(f"/api/tareas/{created['id']}/reabrir")
    assert resp.status_code == 400


def test_tareas_comentario_en_tarea_cerrada_falla(client):
    created = client.post('/api/tareas', json={'titulo': 'A cerrar'}).get_json()
    client.post(f"/api/tareas/{created['id']}/cerrar")
    resp = client.post(f"/api/tareas/{created['id']}/comentarios", json={'texto': 'tarde'})
    assert resp.status_code == 400
