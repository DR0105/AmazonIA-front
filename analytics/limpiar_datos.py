import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import time
import json
import os

# ----------------------------------------------------------------------
# Configuración — SIATAC (focos de calor)
# ----------------------------------------------------------------------
URL_BASE = "https://gis.siatac.co/arcgis/rest/services/MAC_DatosAbiertos/Puntos_Region_100K/MapServer/0/query"
START_DATE = datetime(2017, 1, 1, tzinfo=timezone.utc)
END_DATE   = datetime.now(timezone.utc)

CSV_OUTPUT = 'data/puntos_calor_por_semana_mes_con_coordenadas.csv'

# Si el CSV ya existe → modo incremental: solo descarga el mes actual.
# Si no existe      → modo completo: descarga desde START_DATE.
if os.path.exists(CSV_OUTPUT):
    _FETCH_START = END_DATE.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    print(f"[modo incremental] CSV existente → solo se descarga {_FETCH_START.strftime('%Y-%m')}")
else:
    _FETCH_START = START_DATE
    print(f"[modo completo] CSV no encontrado → descarga desde {START_DATE.date()}")

MAX_RECORDS = 10000
SLEEP_BETWEEN_REQUESTS = 0.5

# ----------------------------------------------------------------------
# Configuración — Precipitación IDEAM (datos.gov.co SODA3)
# ----------------------------------------------------------------------
# SODA3 endpoint: POST con query SoQL en el body JSON.
# App token opcional pero muy recomendado para evitar throttling.
# Regístrate gratis en https://www.datos.gov.co/profile/edit/developer_settings
# y luego: export DATOS_GOV_APP_TOKEN="tu_token"
URL_PRECIP  = "https://www.datos.gov.co/api/v3/views/s54a-sgyg/query.json"
_APP_TOKEN  = os.environ.get("DATOS_GOV_APP_TOKEN", "")

# Solo los departamentos que cubre nuestro modelo (en mayúsculas, como los
# devuelve la API de precipitación del IDEAM).
DEPTOS_MODELO = {
    'AMAZONAS', 'CAQUETÁ', 'CAUCA', 'GUAINÍA', 'GUAVIARE',
    'META', 'NARIÑO', 'PUTUMAYO', 'VAUPÉS', 'VICHADA'
}

# Nombre del sensor de precipitación en la API IDEAM (con tilde, tal como aparece en la API)
SENSOR_PRECIP = "PRECIPITACIÓN"

# Mapeo de nombres de departamento del modelo → nombres en la API de precipitación
# (la API tiene inconsistencias con/sin tildes; este mapeo normaliza ambos lados)
DEPTOS_API_NOMBRES: dict[str, list[str]] = {
    'AMAZONAS': [],                              # Sin estaciones en el dataset
    'CAQUETÁ':  ['CAQUETA', 'CAQUETÁ'],
    'CAUCA':    ['CAUCA'],
    'GUAINÍA':  ['GUAINÍA'],
    'GUAVIARE': [],                              # Sin estaciones en el dataset
    'META':     ['META'],
    'NARIÑO':   ['NARINO', 'NARIÑO'],
    'PUTUMAYO': ['PUTUMAYO'],
    'VAUPÉS':   ['VAUPES', 'VAUPÉS'],
    'VICHADA':  ['VICHADA'],
}
# Conjunto plano de todos los nombres API que corresponden a nuestros deptos
_API_NOMBRES_TODOS = {n for nombres in DEPTOS_API_NOMBRES.values() for n in nombres}
# Mapa inverso: nombre_api → nombre_modelo
_API_A_MODELO = {
    n: modelo
    for modelo, nombres in DEPTOS_API_NOMBRES.items()
    for n in nombres
}


def fetch_precip_mes(anio: int, mes: int) -> dict[str, float]:
    """Descarga las observaciones de precipitación del IDEAM (SODA3) para un
    mes completo, agrega por departamento (promedio de estaciones) y devuelve
    un dict {departamento_modelo: promedio_mm}.

    Usa HTTP POST al endpoint SODA3 con la query SoQL en el body JSON.
    La paginación se hace con pageNumber / pageSize de SODA3.
    """
    if mes == 12:
        next_month = datetime(anio + 1, 1, 1, tzinfo=timezone.utc)
    else:
        next_month = datetime(anio, mes + 1, 1, tzinfo=timezone.utc)
    mes_inicio = datetime(anio, mes, 1, tzinfo=timezone.utc).strftime('%Y-%m-%dT00:00:00.000')
    mes_fin    = (next_month - timedelta(seconds=1)).strftime('%Y-%m-%dT23:59:59.000')

    deptos_filter = ', '.join(f"'{d}'" for d in sorted(_API_NOMBRES_TODOS))
    soql = (
        f"SELECT departamento, valorobservado "
        f"WHERE descripcionsensor = '{SENSOR_PRECIP}' "
        f"AND fechaobservacion >= '{mes_inicio}' "
        f"AND fechaobservacion <= '{mes_fin}' "
        f"AND departamento IN ({deptos_filter}) "
        f"AND valorobservado >= 0"
    )

    headers = {'Content-Type': 'application/json'}
    if _APP_TOKEN:
        headers['X-App-Token'] = _APP_TOKEN

    page_size = 50000
    page      = 1
    all_rows: list[dict] = []

    while True:
        body = {'query': soql, 'page': {'pageNumber': page, 'pageSize': page_size}}
        try:
            resp = requests.post(URL_PRECIP, headers=headers, json=body, timeout=120)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"  [precipitación] error {anio}-{mes:02d} pág {page}: {e}")
            break

        # SODA3 devuelve {"data": [...], "total": N} o directamente una lista
        rows = data.get('data', data) if isinstance(data, dict) else data
        if not isinstance(rows, list):
            break

        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        page += 1
        time.sleep(0.2)

    if not all_rows:
        return {}

    df_p = pd.DataFrame(all_rows)
    df_p['departamento']   = df_p['departamento'].str.upper().str.strip()
    df_p['valorobservado'] = pd.to_numeric(df_p['valorobservado'], errors='coerce')

    # Normalizar nombre de departamento al nombre del modelo
    df_p['dept_modelo'] = df_p['departamento'].map(_API_A_MODELO)
    df_p = df_p[df_p['dept_modelo'].notna()]
    df_p = df_p[df_p['valorobservado'] >= 0]

    # Promedio mensual por departamento-modelo (mm)
    result = df_p.groupby('dept_modelo')['valorobservado'].mean().to_dict()
    return {k: round(v, 2) for k, v in result.items()}

def date_to_ms(date_obj):
    return int(date_obj.timestamp() * 1000)

def get_month_ranges(start, end):
    current = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    while current <= end:
        month_start = current
        if current.month == 12:
            next_month = current.replace(year=current.year+1, month=1, day=1)
        else:
            next_month = current.replace(month=current.month+1, day=1)
        month_end = next_month - timedelta(microseconds=1)
        yield (month_start, month_end)
        current = next_month

def fetch_points(start_ms, end_ms, offset=0):
    params = {
        'where': '1=1',
        'time': f"{start_ms},{end_ms}",
        'outFields': 'acq_date,departamen,municipio,paisaje',
        'returnGeometry': 'true',
        'f': 'geojson',
        'resultRecordCount': MAX_RECORDS,
        'resultOffset': offset
    }
    try:
        resp = requests.get(URL_BASE, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        features = data.get('features', [])
        exceeded = data.get('exceededTransferLimit', False)
        return features, exceeded
    except Exception as e:
        print(f"Error en consulta (offset {offset}): {e}")
        return [], False

def process_month(start_dt, end_dt):
    start_ms = date_to_ms(start_dt)
    end_ms = date_to_ms(end_dt)
    all_features = []
    offset = 0
    while True:
        features, exceeded = fetch_points(start_ms, end_ms, offset)
        if not features:
            break
        all_features.extend(features)
        if not exceeded:
            break
        offset += MAX_RECORDS
        time.sleep(SLEEP_BETWEEN_REQUESTS)
    return all_features

print(f"Iniciando consumo de datos desde {_FETCH_START.date()} hasta {END_DATE.date()}")
print(f"Precipitación: siempre desde {START_DATE.date()} (rango completo independiente)")

# Diccionario para acumular grupos del período a descargar
groups = {}
# Cache de precipitación mensual por (anio, mes, departamento)
precip_cache: dict[tuple, float] = {}

for month_start, month_end in get_month_ranges(START_DATE, END_DATE):
    anio_m = month_start.year
    mes_m  = month_start.month

    # ── Focos de calor (SIATAC) — solo si el mes está en el rango de focos ───
    if month_start >= _FETCH_START:
        print(f"Procesando focos {month_start.strftime('%Y-%m')} ...", end=' ', flush=True)
        features = process_month(month_start, month_end)
        print(f"{len(features)} focos", end='  |  ', flush=True)
    else:
        features = []

    # ── Precipitación (IDEAM / datos.gov.co) — siempre desde 2017 ────────────
    precip_mes = fetch_precip_mes(anio_m, mes_m)
    if features or not precip_mes:
        print(f"precip {len(precip_mes)} deptos")
    else:
        print(f"precip {month_start.strftime('%Y-%m')}: {len(precip_mes)} deptos")
    for depto, val in precip_mes.items():
        precip_cache[(anio_m, mes_m, depto)] = val

    for f in features:
        props = f['properties']
        ts_ms = props.get('acq_date')
        if ts_ms is None:
            continue
        dt = datetime.fromtimestamp(ts_ms / 1000.0, tz=timezone.utc)

        # Coordenadas
        geom = f.get('geometry')
        if geom and geom.get('type') == 'Point':
            coords = geom.get('coordinates', [])
            lon = coords[0] if len(coords) > 0 else None
            lat = coords[1] if len(coords) > 1 else None
        else:
            lon = props.get('longitude')
            lat = props.get('latitude')
        if lon is None or lat is None:
            continue

        # Semana del mes
        week_of_month = (dt.day - 1) // 7 + 1
        key = (dt.year, dt.month, week_of_month,
               props.get('departamen', ''),
               props.get('municipio', ''),
               props.get('paisaje', ''))

        if key not in groups:
            groups[key] = {
                'anio': dt.year,
                'mes': dt.month,
                'semana_mes': week_of_month,
                'departamento': props.get('departamen', ''),
                'municipio': props.get('municipio', ''),
                'paisaje': props.get('paisaje', ''),
                'conteo_puntos': 0,
                'coordenadas': []
            }
        groups[key]['conteo_puntos'] += 1
        groups[key]['coordenadas'].append([lon, lat])
    time.sleep(SLEEP_BETWEEN_REQUESTS)

if not groups:
    print("No se obtuvieron datos.")
    exit()

# Construir DataFrame con precipitación cruzada
rows = []
for data in groups.values():
    depto_upper = data['departamento'].upper().strip()
    precip_val = precip_cache.get((data['anio'], data['mes'], depto_upper), None)
    rows.append({
        'anio':             data['anio'],
        'mes':              data['mes'],
        'semana_mes':       data['semana_mes'],
        'departamento':     data['departamento'],
        'municipio':        data['municipio'],
        'paisaje':          data['paisaje'],
        'conteo_puntos':    data['conteo_puntos'],
        'precip_mm':        precip_val,       # promedio mensual estaciones IDEAM (mm)
        'coordenadas_json': json.dumps(data['coordenadas']),
    })

df_nuevo = pd.DataFrame(rows)
df_nuevo.sort_values(['anio', 'mes', 'semana_mes', 'departamento', 'municipio'], inplace=True)

# En modo incremental: combinar con el CSV existente, reemplazando las filas
# del mes descargado (por si ya existían datos parciales de ese mes).
if os.path.exists(CSV_OUTPUT):
    df_existente = pd.read_csv(CSV_OUTPUT)
    mes_actual_anio = END_DATE.year
    mes_actual_mes  = END_DATE.month
    # Eliminar filas del mes que acabamos de descargar para evitar duplicados
    df_existente = df_existente[
        ~((df_existente['anio'] == mes_actual_anio) & (df_existente['mes'] == mes_actual_mes))
    ]
    df = pd.concat([df_existente, df_nuevo], ignore_index=True)
    df.sort_values(['anio', 'mes', 'semana_mes', 'departamento', 'municipio'], inplace=True)
    print(f"\n[incremental] {len(df_nuevo)} filas nuevas combinadas con {len(df_existente)} existentes")
else:
    df = df_nuevo

output_file = CSV_OUTPUT
df.to_csv(output_file, index=False, encoding='utf-8')
print(f"\nArchivo guardado: {output_file}")
print(f"Total de grupos (año/mes/semana_mes/departamento/municipio/paisaje): {len(df)}")