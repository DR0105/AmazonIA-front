import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import time
import json

# ----------------------------------------------------------------------
# Configuración
# ----------------------------------------------------------------------
URL_BASE = "https://gis.siatac.co/arcgis/rest/services/MAC_DatosAbiertos/Puntos_Region_100K/MapServer/0/query"
START_DATE = datetime(2017, 1, 1, tzinfo=timezone.utc)
END_DATE = datetime.now(timezone.utc)

MAX_RECORDS = 10000
SLEEP_BETWEEN_REQUESTS = 0.5

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

print(f"Iniciando consumo de datos desde {START_DATE.date()} hasta {END_DATE.date()}")

# Diccionario para acumular grupos: clave = (anio, mes, semana_mes, departamento, municipio, paisaje)
groups = {}

for month_start, month_end in get_month_ranges(START_DATE, END_DATE):
    print(f"Procesando {month_start.strftime('%Y-%m')} ...", end=' ', flush=True)
    features = process_month(month_start, month_end)
    print(f"{len(features)} puntos")
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

# Construir DataFrame
rows = []
for data in groups.values():
    rows.append({
        'anio': data['anio'],
        'mes': data['mes'],
        'semana_mes': data['semana_mes'],
        'departamento': data['departamento'],
        'municipio': data['municipio'],
        'paisaje': data['paisaje'],
        'conteo_puntos': data['conteo_puntos'],
        'coordenadas_json': json.dumps(data['coordenadas'])   # lista de [lon, lat]
    })

df = pd.DataFrame(rows)
df.sort_values(['anio', 'mes', 'semana_mes', 'departamento', 'municipio'], inplace=True)

output_file = 'data/puntos_calor_por_semana_mes_con_coordenadas.csv'
df.to_csv(output_file, index=False, encoding='utf-8')
print(f"\nArchivo guardado: {output_file}")
print(f"Total de grupos (año/mes/semana_mes/departamento/municipio/paisaje): {len(df)}")