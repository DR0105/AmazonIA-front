import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import time
import json
import os

# ----------------------------------------------------------------------
# Configuración — SIATAC (focos de calor)
# ----------------------------------------------------------------------
URL_BASE   = "https://gis.siatac.co/arcgis/rest/services/MAC_DatosAbiertos/Puntos_Region_100K/MapServer/0/query"
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

MAX_RECORDS           = 10000
SLEEP_BETWEEN_REQUESTS = 0.5


# ----------------------------------------------------------------------
# Funciones — SIATAC
# ----------------------------------------------------------------------
def date_to_ms(date_obj):
    return int(date_obj.timestamp() * 1000)


def get_month_ranges(start, end):
    current = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    while current <= end:
        month_start = current
        if current.month == 12:
            next_month = current.replace(year=current.year + 1, month=1, day=1)
        else:
            next_month = current.replace(month=current.month + 1, day=1)
        month_end = next_month - timedelta(microseconds=1)
        yield (month_start, month_end)
        current = next_month


def fetch_points(start_ms, end_ms, offset=0):
    params = {
        'where':             '1=1',
        'time':              f"{start_ms},{end_ms}",
        'outFields':         'acq_date,departamen,municipio,paisaje',
        'returnGeometry':    'true',
        'f':                 'geojson',
        'resultRecordCount': MAX_RECORDS,
        'resultOffset':      offset,
    }
    try:
        resp = requests.get(URL_BASE, params=params, timeout=30)
        resp.raise_for_status()
        data     = resp.json()
        features = data.get('features', [])
        exceeded = data.get('exceededTransferLimit', False)
        return features, exceeded
    except Exception as e:
        print(f"Error en consulta (offset {offset}): {e}")
        return [], False


def process_month(start_dt, end_dt):
    start_ms   = date_to_ms(start_dt)
    end_ms     = date_to_ms(end_dt)
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


# ----------------------------------------------------------------------
# Descarga principal
# ----------------------------------------------------------------------
print(f"Iniciando consumo de datos desde {_FETCH_START.date()} hasta {END_DATE.date()}")

groups: dict = {}

for month_start, month_end in get_month_ranges(_FETCH_START, END_DATE):
    print(f"Procesando {month_start.strftime('%Y-%m')} ...", end=' ', flush=True)
    features = process_month(month_start, month_end)
    print(f"{len(features)} puntos")

    for f in features:
        props = f['properties']
        ts_ms = props.get('acq_date')
        if ts_ms is None:
            continue
        dt = datetime.fromtimestamp(ts_ms / 1000.0, tz=timezone.utc)

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

        week_of_month = (dt.day - 1) // 7 + 1
        key = (dt.year, dt.month, week_of_month,
               props.get('departamen', ''),
               props.get('municipio', ''),
               props.get('paisaje', ''))

        if key not in groups:
            groups[key] = {
                'anio':        dt.year,
                'mes':         dt.month,
                'semana_mes':  week_of_month,
                'departamento': props.get('departamen', ''),
                'municipio':   props.get('municipio', ''),
                'paisaje':     props.get('paisaje', ''),
                'conteo_puntos': 0,
                'coordenadas': [],
            }
        groups[key]['conteo_puntos'] += 1
        groups[key]['coordenadas'].append([lon, lat])
    time.sleep(SLEEP_BETWEEN_REQUESTS)

if not groups:
    print("No se obtuvieron datos.")
    exit()

# Construir DataFrame
rows = []
for data in groups.values():
    rows.append({
        'anio':             data['anio'],
        'mes':              data['mes'],
        'semana_mes':       data['semana_mes'],
        'departamento':     data['departamento'],
        'municipio':        data['municipio'],
        'paisaje':          data['paisaje'],
        'conteo_puntos':    data['conteo_puntos'],
        'coordenadas_json': json.dumps(data['coordenadas']),
    })

df_nuevo = pd.DataFrame(rows)
df_nuevo.sort_values(['anio', 'mes', 'semana_mes', 'departamento', 'municipio'], inplace=True)

# Modo incremental: combinar con CSV existente descartando el mes recién descargado
if os.path.exists(CSV_OUTPUT):
    df_existente = pd.read_csv(CSV_OUTPUT)
    df_existente = df_existente[
        ~((df_existente['anio'] == END_DATE.year) & (df_existente['mes'] == END_DATE.month))
    ]
    df = pd.concat([df_existente, df_nuevo], ignore_index=True)
    df.sort_values(['anio', 'mes', 'semana_mes', 'departamento', 'municipio'], inplace=True)
    print(f"\n[incremental] {len(df_nuevo)} filas nuevas combinadas con {len(df_existente)} existentes")
else:
    df = df_nuevo

df.to_csv(CSV_OUTPUT, index=False, encoding='utf-8')
print(f"\nArchivo guardado: {CSV_OUTPUT}")
print(f"Total de grupos: {len(df)}")
