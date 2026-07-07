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
HORIZON = 6           # meses a pronosticar hacia adelante
TEST_MONTHS = 12      # tamaño del set de prueba (últimos N meses por departamento)
RECENT_YEARS = 3      # años recientes a incluir en las coordenadas de alto riesgo
 
CSV_INPUT = 'data/puntos_calor_por_semana_mes_con_coordenadas.csv'
JSON_OUTPUT = 'data/predicciones.json'
 
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
filled_frames = []
cobertura_datos = {}
 
for dept, g in monthly.groupby('departamento'):
    g = g.sort_values('fecha')
    rango_completo = pd.date_range(g['fecha'].min(), g['fecha'].max(), freq='MS')
 
    g_full = g.set_index('fecha').reindex(rango_completo)
    g_full['total_mensual'] = g_full['total_mensual'].fillna(0)
    g_full['departamento'] = dept
    g_full['anio'] = g_full.index.year
    g_full['mes'] = g_full.index.month
    g_full.index.name = 'fecha'
    g_full = g_full.reset_index()
 
    cobertura_datos[dept] = {
        'meses_con_datos_originales': int(len(g)),
        'meses_totales_tras_relleno': int(len(g_full)),
        'primer_mes': g['fecha'].min().strftime('%Y-%m'),
        'ultimo_mes_con_datos': g['fecha'].max().strftime('%Y-%m'),
    }
 
    filled_frames.append(g_full[['fecha', 'anio', 'mes', 'departamento', 'total_mensual']])
 
monthly = pd.concat(filled_frames, ignore_index=True)
monthly.sort_values(['departamento', 'fecha'], inplace=True)
 
# =============================================================================
# 4. Umbrales de riesgo por departamento (sobre la serie completa, con ceros)
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
    if total <= p33:
        return 'bajo'
    elif total <= p66:
        return 'medio'
    else:
        return 'alto'
 
 
monthly['riesgo'] = monthly.apply(lambda r: label_risk(r['departamento'], r['total_mensual']), axis=1)
print("\nDistribución de riesgos (histórico, incluyendo meses sin registros = 0):")
print(monthly['riesgo'].value_counts())
 
# =============================================================================
# 5. Variables de rezago y medias móviles (sin fuga de información: solo usan
#    valores de meses anteriores, vía shift(1))
# =============================================================================
feature_frames = []
for dept, g in monthly.groupby('departamento'):
    g = g.sort_values('fecha').reset_index(drop=True).copy()
    serie = g['total_mensual']
    g['lag_1'] = serie.shift(1)
    g['lag_2'] = serie.shift(2)
    g['lag_3'] = serie.shift(3)
    g['lag_6'] = serie.shift(6)
    g['lag_12'] = serie.shift(12)
    g['media_movil_3'] = serie.shift(1).rolling(3).mean()
    g['media_movil_6'] = serie.shift(1).rolling(6).mean()
    g['media_movil_12'] = serie.shift(1).rolling(12).mean()
    feature_frames.append(g)
 
monthly = pd.concat(feature_frames, ignore_index=True)
 
# Codificación estacional cíclica del mes
monthly['mes_sin'] = np.sin(2 * np.pi * monthly['mes'] / 12)
monthly['mes_cos'] = np.cos(2 * np.pi * monthly['mes'] / 12)
 
# Codificación numérica del departamento
le = LabelEncoder()
monthly['dept_code'] = le.fit_transform(monthly['departamento'])
 
FEATURE_COLS = ['anio', 'mes', 'mes_sin', 'mes_cos', 'dept_code',
                'lag_1', 'lag_2', 'lag_3', 'lag_6', 'lag_12',
                'media_movil_3', 'media_movil_6', 'media_movil_12']
 
model_data = monthly.dropna(subset=FEATURE_COLS).reset_index(drop=True)
print(f"\nFilas utilizables tras crear variables de rezago: {len(model_data)}")
 
# =============================================================================
# 6. Partición temporal (no aleatoria): últimos TEST_MONTHS meses por depto
# =============================================================================
model_data = model_data.sort_values(['departamento', 'fecha'])
 
train_parts, test_parts = [], []
for dept, g in model_data.groupby('departamento'):
    g = g.sort_values('fecha')
    if len(g) > TEST_MONTHS:
        train_parts.append(g.iloc[:-TEST_MONTHS])
        test_parts.append(g.iloc[-TEST_MONTHS:])
    else:
        train_parts.append(g)
 
train = pd.concat(train_parts, ignore_index=True)
test = pd.concat(test_parts, ignore_index=True) if test_parts else pd.DataFrame(columns=model_data.columns)
 
print(f"Filas de entrenamiento: {len(train)} | Filas de prueba: {len(test)}")
print(f"Rango de prueba: {test['fecha'].min()} -> {test['fecha'].max()}" if len(test) else "Sin set de prueba")
 
X_train, y_train = train[FEATURE_COLS], np.log1p(train['total_mensual'])
X_test, y_test = test[FEATURE_COLS], np.log1p(test['total_mensual']) if len(test) else None
 
# =============================================================================
# 7. Entrenamiento del modelo de regresión
# =============================================================================
reg = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    min_samples_leaf=2,
    random_state=RANDOM_STATE,
    n_jobs=-1,
)
reg.fit(X_train, y_train)
 
# =============================================================================
# 8. Evaluación del modelo
# =============================================================================
metricas_regresion = {}
metricas_riesgo = {}
 
if len(test):
    y_pred_log = reg.predict(X_test)
    y_pred = np.expm1(y_pred_log)
    y_pred = np.clip(y_pred, 0, None)
    y_true = test['total_mensual'].values
 
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    r2 = r2_score(y_true, y_pred)
 
    print("\n=== Evaluación del modelo (regresión, escala original) ===")
    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R2:   {r2:.3f}")
 
    metricas_regresion = {
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'meses_evaluados_por_departamento': TEST_MONTHS,
    }
 
    # Traducir predicciones y valores reales a niveles de riesgo para comparar
    # con el criterio original (bajo/medio/alto)
    y_true_risk = [label_risk(d, t) for d, t in zip(test['departamento'], y_true)]
    y_pred_risk = [label_risk(d, t) for d, t in zip(test['departamento'], y_pred)]
 
    acc = accuracy_score(y_true_risk, y_pred_risk)
    reporte = classification_report(y_true_risk, y_pred_risk, output_dict=True, zero_division=0)
 
    print("\n=== Evaluación como clasificación de riesgo (bajo/medio/alto) ===")
    print(f"Accuracy: {acc:.3f}")
    print(classification_report(y_true_risk, y_pred_risk, zero_division=0))
 
    metricas_riesgo = {
        'accuracy': float(acc),
        'precision_macro': float(reporte['macro avg']['precision']),
        'recall_macro': float(reporte['macro avg']['recall']),
        'f1_macro': float(reporte['macro avg']['f1-score']),
    }
 
# Importancia de variables
importancias = dict(zip(FEATURE_COLS, reg.feature_importances_.tolist()))
print("\nImportancia de variables:")
for var, imp in sorted(importancias.items(), key=lambda x: -x[1]):
    print(f"  {var}: {imp:.3f}")
 
# =============================================================================
# 9. Pronóstico recursivo a 6 meses, por departamento
# =============================================================================
predictions = []
 
for dept in le.classes_:
    dept_code = int(le.transform([dept])[0])
    hist = monthly[monthly['departamento'] == dept].sort_values('fecha')
    serie = hist['total_mensual'].tolist()
    last_date = hist['fecha'].max()
 
    for h in range(1, HORIZON + 1):
        future_date = last_date + pd.DateOffset(months=h)
        anio_f, mes_f = int(future_date.year), int(future_date.month)
 
        lag_1 = serie[-1]
        lag_2 = serie[-2]
        lag_3 = serie[-3]
        lag_6 = serie[-6]
        lag_12 = serie[-12]
        media_3 = float(np.mean(serie[-3:]))
        media_6 = float(np.mean(serie[-6:]))
        media_12 = float(np.mean(serie[-12:]))
        mes_sin = float(np.sin(2 * np.pi * mes_f / 12))
        mes_cos = float(np.cos(2 * np.pi * mes_f / 12))
 
        X_fut = pd.DataFrame([[anio_f, mes_f, mes_sin, mes_cos, dept_code,
                                lag_1, lag_2, lag_3, lag_6, lag_12,
                                media_3, media_6, media_12]], columns=FEATURE_COLS)
 
        pred_log = reg.predict(X_fut)[0]
        pred_total = max(0.0, float(np.expm1(pred_log)))
 
        # Incertidumbre: desviación estándar de las predicciones de cada árbol
        X_fut_arr = X_fut.values
        arbol_preds = np.expm1([t.predict(X_fut_arr)[0] for t in reg.estimators_])
        incertidumbre = float(np.std(arbol_preds))
 
        riesgo = label_risk(dept, pred_total)
 
        predictions.append({
            'anio': anio_f,
            'mes': mes_f,
            'departamento': dept,
            'total_predicho': round(pred_total, 1),
            'incertidumbre_estimada': round(incertidumbre, 1),
            'riesgo_predicho': riesgo,
        })
 
        # Extiende la serie con la predicción para alimentar el siguiente paso
        serie.append(pred_total)
 
df_pred = pd.DataFrame(predictions)

# Descartar predicciones cuyo mes ya pasó respecto a la fecha de ejecución.
# Cada departamento pronostica desde su propio último dato, por lo que algunos
# meses pueden caer en el pasado si la fuente de datos llegaba con retraso.
# Solo conservamos meses presentes o futuros.
_hoy = datetime.now(timezone.utc)
_anio_actual, _mes_actual = _hoy.year, _hoy.month
df_pred = df_pred[
    (df_pred['anio'] > _anio_actual) |
    ((df_pred['anio'] == _anio_actual) & (df_pred['mes'] >= _mes_actual))
].reset_index(drop=True)

print(f"\nMeses en el pronóstico tras filtrar pasados: {sorted(df_pred[['anio','mes']].drop_duplicates().itertuples(index=False, name=None))}")

# =============================================================================
# 10. Coordenadas históricas recientes para predicciones de "alto" riesgo
# =============================================================================
max_anio = int(df['anio'].max())
anio_min_coords = max_anio - RECENT_YEARS + 1
 
high_risk_points = []
for _, row in df_pred[df_pred['riesgo_predicho'] == 'alto'].iterrows():
    dept = row['departamento']
    month = int(row['mes'])
 
    mask = (df['departamento'] == dept) & (df['mes'] == month) & (df['anio'] >= anio_min_coords)
    coords_series = df.loc[mask, 'coordenadas_json'].apply(json.loads)
    points = [coord for sublist in coords_series for coord in sublist]
 
    high_risk_points.append({
        'departamento': dept,
        'mes': month,
        'anio_prediccion': int(row['anio']),
        'anios_considerados': f"{anio_min_coords}-{max_anio}",
        'coordenadas': points,
        'total_puntos_historicos': len(points),
    })
 
# =============================================================================
# 11. Generar JSON de salida
# =============================================================================
output_json = {
    'metadata': {
        'modelo': 'RandomForestRegressor (sobre log1p del conteo mensual) + '
                  'umbrales de riesgo por departamento',
        'umbrales_riesgo': {
            dept: {'bajo': f"≤{p33:.0f}", 'medio': f">{p33:.0f} y ≤{p66:.0f}", 'alto': f">{p66:.0f}"}
            for dept, (p33, p66) in risk_thresholds.items()
        },
        'cobertura_datos_por_departamento': cobertura_datos,
        'metricas_regresion': metricas_regresion,
        'metricas_clasificacion_riesgo': metricas_riesgo,
        'importancia_variables': importancias,
        'parametros': {
            'horizonte_meses': HORIZON,
            'meses_prueba_por_departamento': TEST_MONTHS,
            'anios_recientes_para_coordenadas': RECENT_YEARS,
        },
        'notas': [
            "Los meses sin registros en el CSV original se interpretaron como 0 "
            "puntos de calor y se rellenaron para no distorsionar los rezagos.",
            "Cada departamento pronostica sus 6 meses siguientes a partir de su "
            "propio último mes con datos (no todos llegan hasta la misma fecha).",
            "El pronóstico es recursivo: cada mes futuro usa las predicciones de "
            "los meses anteriores como insumo, por lo que la incertidumbre crece "
            "con el horizonte.",
        ],
    },
    'predicciones_proximos_6_meses': df_pred.to_dict(orient='records'),
    'puntos_alto_riesgo': high_risk_points,
}
 
with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output_json, f, indent=2, ensure_ascii=False)
 
print(f"\nArchivo JSON generado: {JSON_OUTPUT}")
 
# =============================================================================
# 12. Resumen exploratorio (solo texto, sin gráficos)
# =============================================================================
top_dept = monthly.groupby('departamento')['total_mensual'].sum().sort_values(ascending=False).head(10)
print("\nTop 10 departamentos con mayor actividad histórica (incluyendo ceros):")
print(top_dept)
 
print("\nProceso completado. Revise el archivo JSON generado.")