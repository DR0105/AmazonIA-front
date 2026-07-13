import pandas as pd
import numpy as np
import json
from datetime import datetime, timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report

# =============================================================================
# Configuración
# =============================================================================
RANDOM_STATE = 42
HORIZON      = 6        # meses a pronosticar hacia adelante
TEST_MONTHS  = 12       # tamaño del set de prueba (últimos N meses por departamento)
RECENT_YEARS = 3        # años recientes para coordenadas de alto riesgo

CSV_INPUT   = 'data/puntos_calor_por_semana_mes_con_coordenadas.csv'
JSON_OUTPUT = 'data/predicciones.json'

# También exportar a public/data/ para que Vercel sirva los archivos
import os, shutil
PUBLIC_DATA = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(PUBLIC_DATA, exist_ok=True)

# =============================================================================
# 1. Carga de datos
# =============================================================================
df = pd.read_csv(CSV_INPUT)
print("Columnas:", df.columns.tolist())
print("Registros cargados:", len(df))

# =============================================================================
# 2. Agregación mensual por departamento
# =============================================================================
monthly = df.groupby(['anio', 'mes', 'departamento'])['conteo_puntos'].sum().reset_index()
monthly.rename(columns={'conteo_puntos': 'total_mensual'}, inplace=True)
monthly['fecha'] = pd.to_datetime(dict(year=monthly['anio'], month=monthly['mes'], day=1))

# =============================================================================
# 3. Relleno de meses faltantes (huecos internos) con 0, por departamento
# =============================================================================
filled_frames  = []
cobertura_datos = {}

for dept, g in monthly.groupby('departamento'):
    g = g.sort_values('fecha')
    rango_completo = pd.date_range(g['fecha'].min(), g['fecha'].max(), freq='MS')

    g_full = g.set_index('fecha').reindex(rango_completo)
    g_full['total_mensual'] = g_full['total_mensual'].fillna(0)
    g_full['departamento']  = dept
    g_full['anio']          = g_full.index.year
    g_full['mes']           = g_full.index.month
    g_full.index.name = 'fecha'
    g_full = g_full.reset_index()

    cobertura_datos[dept] = {
        'meses_con_datos_originales': int(len(g)),
        'meses_totales_tras_relleno': int(len(g_full)),
        'primer_mes':             g['fecha'].min().strftime('%Y-%m'),
        'ultimo_mes_con_datos':   g['fecha'].max().strftime('%Y-%m'),
    }

    filled_frames.append(g_full[['fecha', 'anio', 'mes', 'departamento', 'total_mensual']])

monthly = pd.concat(filled_frames, ignore_index=True)
monthly.sort_values(['departamento', 'fecha'], inplace=True)

# =============================================================================
# 4. Umbrales de riesgo por departamento
# =============================================================================
risk_thresholds = {}
for dept, g in monthly.groupby('departamento'):
    data = g['total_mensual']
    if len(data) >= 3:
        p33, p66 = data.quantile(0.33), data.quantile(0.66)
    else:
        p33, p66 = data.mean() * 0.5, data.mean() * 1.5
    risk_thresholds[dept] = (float(p33), float(p66))


def label_risk(dept, total):
    p33, p66 = risk_thresholds[dept]
    if total <= p33:   return 'bajo'
    elif total <= p66: return 'medio'
    else:              return 'alto'


monthly['riesgo'] = monthly.apply(
    lambda r: label_risk(r['departamento'], r['total_mensual']), axis=1
)
print("\nDistribución de riesgos (histórico):")
print(monthly['riesgo'].value_counts())

# =============================================================================
# 5. Variables de rezago y medias móviles por departamento
# =============================================================================
le = LabelEncoder()
monthly['dept_code'] = le.fit_transform(monthly['departamento'])

feature_frames = []
for dept, g in monthly.groupby('departamento'):
    g    = g.sort_values('fecha').reset_index(drop=True).copy()
    serie = g['total_mensual']
    g['lag_1']  = serie.shift(1)
    g['lag_2']  = serie.shift(2)
    g['lag_3']  = serie.shift(3)
    g['lag_6']  = serie.shift(6)
    g['lag_12'] = serie.shift(12)
    g['media_movil_3']  = serie.shift(1).rolling(3).mean()
    g['media_movil_6']  = serie.shift(1).rolling(6).mean()
    g['media_movil_12'] = serie.shift(1).rolling(12).mean()
    feature_frames.append(g)

monthly = pd.concat(feature_frames, ignore_index=True)
monthly['mes_sin'] = np.sin(2 * np.pi * monthly['mes'] / 12)
monthly['mes_cos'] = np.cos(2 * np.pi * monthly['mes'] / 12)

FEATURE_COLS = ['anio', 'mes', 'mes_sin', 'mes_cos',
                'lag_1', 'lag_2', 'lag_3', 'lag_6', 'lag_12',
                'media_movil_3', 'media_movil_6', 'media_movil_12']

model_data = monthly.dropna(subset=FEATURE_COLS).reset_index(drop=True)
print(f"\nFilas utilizables tras crear variables de rezago: {len(model_data)}")

# =============================================================================
# 6 + 7 + 8. Entrenamiento, evaluación e importancia por departamento
# =============================================================================
departamentos = sorted(model_data['departamento'].unique())
modelos:                dict[str, RandomForestRegressor] = {}
metricas_por_depto:     dict[str, dict]                  = {}
importancias_por_depto: dict[str, dict]                  = {}

all_y_true, all_y_pred, all_y_true_risk, all_y_pred_risk = [], [], [], []

print("\n" + "=" * 60)
print("ENTRENAMIENTO POR DEPARTAMENTO")
print("=" * 60)

for dept in departamentos:
    g = model_data[model_data['departamento'] == dept].sort_values('fecha')

    if len(g) <= TEST_MONTHS:
        X_tr, y_tr           = g[FEATURE_COLS], np.log1p(g['total_mensual'])
        X_te, y_te_vals      = pd.DataFrame(columns=FEATURE_COLS), np.array([])
    else:
        X_tr     = g.iloc[:-TEST_MONTHS][FEATURE_COLS]
        y_tr     = np.log1p(g.iloc[:-TEST_MONTHS]['total_mensual'])
        X_te     = g.iloc[-TEST_MONTHS:][FEATURE_COLS]
        y_te_vals = g.iloc[-TEST_MONTHS:]['total_mensual'].values

    reg_dept = RandomForestRegressor(
        n_estimators=300, max_depth=10, min_samples_leaf=2,
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    reg_dept.fit(X_tr, y_tr)
    modelos[dept] = reg_dept
    importancias_por_depto[dept] = dict(zip(FEATURE_COLS, reg_dept.feature_importances_.tolist()))

    if len(X_te) > 0:
        y_pred_log  = reg_dept.predict(X_te)
        y_pred_vals = np.clip(np.expm1(y_pred_log), 0, None)

        mae  = float(mean_absolute_error(y_te_vals, y_pred_vals))
        rmse = float(np.sqrt(np.mean((y_te_vals - y_pred_vals) ** 2)))
        r2   = float(r2_score(y_te_vals, y_pred_vals))

        y_tr_risk = [label_risk(dept, t) for t in y_te_vals]
        y_pr_risk = [label_risk(dept, t) for t in y_pred_vals]
        acc = float(accuracy_score(y_tr_risk, y_pr_risk))
        rep = classification_report(y_tr_risk, y_pr_risk, output_dict=True, zero_division=0)

        metricas_por_depto[dept] = {
            'mae':             round(mae, 2),
            'rmse':            round(rmse, 2),
            'r2':              round(r2, 3),
            'accuracy_riesgo': round(acc, 3),
            'precision_macro': round(rep['macro avg']['precision'], 3),
            'recall_macro':    round(rep['macro avg']['recall'], 3),
            'f1_macro':        round(rep['macro avg']['f1-score'], 3),
            'meses_evaluados': int(len(X_te)),
        }

        all_y_true.extend(y_te_vals.tolist())
        all_y_pred.extend(y_pred_vals.tolist())
        all_y_true_risk.extend(y_tr_risk)
        all_y_pred_risk.extend(y_pr_risk)

        top_var = sorted(importancias_por_depto[dept].items(), key=lambda x: -x[1])[0]
        print(f"  {dept:20s}  MAE={mae:7.1f}  R2={r2:.3f}  Acc={acc:.2f}  "
              f"top_feature={top_var[0]} ({top_var[1]:.2f})")
    else:
        metricas_por_depto[dept] = {'nota': 'Datos insuficientes para evaluación'}
        print(f"  {dept:20s}  sin evaluación (datos insuficientes)")

# Métricas globales
metricas_globales: dict = {}
if all_y_true:
    mae_g  = float(mean_absolute_error(all_y_true, all_y_pred))
    rmse_g = float(np.sqrt(np.mean((np.array(all_y_true) - np.array(all_y_pred)) ** 2)))
    r2_g   = float(r2_score(all_y_true, all_y_pred))
    acc_g  = float(accuracy_score(all_y_true_risk, all_y_pred_risk))
    rep_g  = classification_report(all_y_true_risk, all_y_pred_risk, output_dict=True, zero_division=0)

    metricas_globales = {
        'mae':               round(mae_g, 2),
        'rmse':              round(rmse_g, 2),
        'r2':                round(r2_g, 3),
        'accuracy_riesgo':   round(acc_g, 3),
        'precision_macro':   round(rep_g['macro avg']['precision'], 3),
        'recall_macro':      round(rep_g['macro avg']['recall'], 3),
        'f1_macro':          round(rep_g['macro avg']['f1-score'], 3),
        'meses_evaluados_total':             int(len(all_y_true)),
        'meses_evaluados_por_departamento':  TEST_MONTHS,
    }

    print(f"\n{'=' * 60}")
    print(f"GLOBAL  MAE={mae_g:.1f}  RMSE={rmse_g:.1f}  R2={r2_g:.3f}  Acc={acc_g:.3f}")
    print(classification_report(all_y_true_risk, all_y_pred_risk, zero_division=0))

# Importancia media entre departamentos
importancias_media: dict[str, float] = {
    feat: float(np.mean([importancias_por_depto[d].get(feat, 0) for d in departamentos]))
    for feat in FEATURE_COLS
}

# Promedio histórico por departamento (para la tabla del dash)
promedios_historicos = (
    monthly[monthly['total_mensual'] > 0]
    .groupby('departamento')['total_mensual']
    .mean().round(1).to_dict()
)
for dept in departamentos:
    if dept in metricas_por_depto and isinstance(metricas_por_depto[dept], dict):
        metricas_por_depto[dept]['promedio_historico_mensual'] = round(
            float(promedios_historicos.get(dept, 0)), 1
        )

# =============================================================================
# 9. Pronóstico recursivo a 6 meses, por departamento
# =============================================================================
_hoy_pronostico = datetime.now(timezone.utc)
_anio_actual    = _hoy_pronostico.year
_mes_actual     = _hoy_pronostico.month

predictions: list = []
meses_rellenados_por_depto: dict[str, list[str]] = {}

print(f"\n{'=' * 60}")
print("PRONÓSTICO")
print("=" * 60)

for dept in departamentos:
    reg_dept  = modelos[dept]
    dept_hist = monthly[monthly['departamento'] == dept].sort_values('fecha')
    serie     = dept_hist['total_mensual'].tolist()
    last_date = dept_hist['fecha'].max()

    # Rellenar gap hasta el mes previo al actual con ceros
    meses_rellenados: list[str] = []
    cursor     = last_date + pd.DateOffset(months=1)
    mes_limite = pd.Timestamp(year=_anio_actual, month=_mes_actual, day=1)

    while cursor < mes_limite:
        serie.append(0.0)
        meses_rellenados.append(cursor.strftime('%Y-%m'))
        cursor += pd.DateOffset(months=1)

    if meses_rellenados:
        print(f"  [{dept}] rellenados {meses_rellenados} con 0")

    meses_rellenados_por_depto[dept] = meses_rellenados
    start_date = cursor  # primer mes a pronosticar

    for h in range(1, HORIZON + 1):
        future_date = start_date + pd.DateOffset(months=h - 1)
        anio_f = int(future_date.year)
        mes_f  = int(future_date.month)

        lag_1  = serie[-1];  lag_2 = serie[-2];  lag_3 = serie[-3]
        lag_6  = serie[-6];  lag_12 = serie[-12]
        media_3  = float(np.mean(serie[-3:]))
        media_6  = float(np.mean(serie[-6:]))
        media_12 = float(np.mean(serie[-12:]))
        mes_sin  = float(np.sin(2 * np.pi * mes_f / 12))
        mes_cos  = float(np.cos(2 * np.pi * mes_f / 12))

        X_fut = pd.DataFrame(
            [[anio_f, mes_f, mes_sin, mes_cos,
              lag_1, lag_2, lag_3, lag_6, lag_12,
              media_3, media_6, media_12]],
            columns=FEATURE_COLS
        )

        pred_log   = reg_dept.predict(X_fut)[0]
        pred_total = max(0.0, float(np.expm1(pred_log)))

        arbol_preds  = np.expm1([t.predict(X_fut.values)[0] for t in reg_dept.estimators_])
        incertidumbre = float(np.std(arbol_preds))

        predictions.append({
            'anio':                   anio_f,
            'mes':                    mes_f,
            'departamento':           dept,
            'total_predicho':         round(pred_total, 1),
            'incertidumbre_estimada': round(incertidumbre, 1),
            'riesgo_predicho':        label_risk(dept, pred_total),
        })
        serie.append(pred_total)

df_pred = pd.DataFrame(predictions)

# Descartar meses pasados
_hoy2 = datetime.now(timezone.utc)
df_pred = df_pred[
    (df_pred['anio'] > _hoy2.year) |
    ((df_pred['anio'] == _hoy2.year) & (df_pred['mes'] >= _hoy2.month))
].reset_index(drop=True)

print(f"\nMeses en el pronóstico: "
      f"{sorted(df_pred[['anio','mes']].drop_duplicates().itertuples(index=False, name=None))}")

# =============================================================================
# 10. Coordenadas históricas recientes para alto riesgo
# =============================================================================
max_anio        = int(df['anio'].max())
anio_min_coords = max_anio - RECENT_YEARS + 1

high_risk_points = []
for _, row in df_pred[df_pred['riesgo_predicho'] == 'alto'].iterrows():
    dept  = row['departamento']
    month = int(row['mes'])
    mask  = (df['departamento'] == dept) & (df['mes'] == month) & (df['anio'] >= anio_min_coords)
    coords_list = df.loc[mask, 'coordenadas_json'].apply(json.loads)
    points = [c for sub in coords_list for c in sub]
    high_risk_points.append({
        'departamento':           dept,
        'mes':                    month,
        'anio_prediccion':        int(row['anio']),
        'anios_considerados':     f"{anio_min_coords}-{max_anio}",
        'coordenadas':            points,
        'total_puntos_historicos': len(points),
    })

# =============================================================================
# 11. JSON de predicciones
# =============================================================================
output_json = {
    'metadata': {
        'modelo': 'Un RandomForestRegressor independiente por departamento '
                  '(log1p target) + umbrales de riesgo relativos por departamento',
        'umbrales_riesgo': {
            dept: {
                'bajo':  f"≤{p33:.0f}",
                'medio': f">{p33:.0f} y ≤{p66:.0f}",
                'alto':  f">{p66:.0f}",
            }
            for dept, (p33, p66) in risk_thresholds.items()
        },
        'cobertura_datos_por_departamento': cobertura_datos,
        'meses_rellenados_con_cero':        meses_rellenados_por_depto,
        'metricas_globales':                metricas_globales,
        'metricas_por_departamento':        metricas_por_depto,
        'importancia_variables_media':      importancias_media,
        'importancia_variables_por_departamento': importancias_por_depto,
        'parametros': {
            'modelos':                         'uno por departamento',
            'horizonte_meses':                 HORIZON,
            'meses_prueba_por_departamento':   TEST_MONTHS,
            'anios_recientes_para_coordenadas': RECENT_YEARS,
        },
        'notas': [
            "Se entrena un modelo independiente por departamento.",
            "Los meses sin registros se rellenaron con 0 para no distorsionar rezagos.",
            "Si el último dato está antes del mes actual, los meses intermedios "
            "se rellenan con 0 antes del pronóstico (ver meses_rellenados_con_cero).",
            "El pronóstico es recursivo: la incertidumbre crece con el horizonte.",
        ],
    },
    'predicciones_proximos_6_meses': df_pred.to_dict(orient='records'),
    'puntos_alto_riesgo':            high_risk_points,
}

with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output_json, f, indent=2, ensure_ascii=False)

print(f"\nArchivo JSON generado: {JSON_OUTPUT}")

# Sincronizar a public/data/ para Vercel
shutil.copy(JSON_OUTPUT, os.path.join(PUBLIC_DATA, 'predicciones.json'))
shutil.copy(CSV_INPUT,   os.path.join(PUBLIC_DATA, 'puntos_calor.csv'))
print(f"Archivos sincronizados a public/data/")

# =============================================================================
# 12. Generar puntos_historicos.json para el mapa del front
# =============================================================================
print("\nGenerando puntos_historicos.json...")

df_hist = pd.read_csv(CSV_INPUT,
                      usecols=['anio', 'mes', 'semana_mes', 'departamento',
                                'municipio', 'paisaje', 'coordenadas_json'])

puntos_hist: list = []
for _, row in df_hist.iterrows():
    try:
        coords = json.loads(row['coordenadas_json'])
        for lon, lat in coords:
            puntos_hist.append([
                round(float(lon), 5),
                round(float(lat), 5),
                str(row['departamento']),
                str(row['municipio']),
                str(row['paisaje']),
                int(row['anio']),
                int(row['mes']),
                int(row['semana_mes']),
            ])
    except Exception:
        pass

historicos_output = {
    'columns': ['lon', 'lat', 'departamento', 'municipio', 'paisaje', 'anio', 'mes', 'semana_mes'],
    'data':    puntos_hist,
}
HISTORICOS_FILE = JSON_OUTPUT.replace('predicciones.json', 'puntos_historicos.json')
with open(HISTORICOS_FILE, 'w', encoding='utf-8') as f:
    json.dump(historicos_output, f, ensure_ascii=False, separators=(',', ':'))

print(f"puntos_historicos.json generado: {len(puntos_hist):,} puntos → {HISTORICOS_FILE}")

# Sincronizar puntos_historicos.json a public/data/
shutil.copy(HISTORICOS_FILE, os.path.join(PUBLIC_DATA, 'puntos_historicos.json'))

# =============================================================================
# 13. Resumen
# =============================================================================
top_dept = monthly.groupby('departamento')['total_mensual'].sum().sort_values(ascending=False).head(10)
print("\nTop departamentos por actividad histórica:")
print(top_dept)
print("\nProceso completado.")
